/**
 * ONNX Binary Exporter for Prosoft-V2 Machine Learning Models
 * Generates valid .onnx (Protocol Buffers) binary files compliant with ONNX IR v8 / opset 17.
 * These models can be opened in Netron (netron.app) or loaded in Python (import onnx; onnx.load(...)).
 */

export interface NNWeights {
  W1: number[][]; // hidden x inDim (64 x 2)
  b1: number[];   // hidden (64)
  W2: number[][]; // hidden x hidden (64 x 64)
  b2: number[];   // hidden (64)
  W3: number[][]; // outDim x hidden (1 x 64)
  b3: number[];   // outDim (1)
}

/**
 * Minimal Protocol Buffers binary encoder
 */
class ProtoWriter {
  private chunks: Uint8Array[] = [];

  writeVarint(val: number) {
    let v = Math.floor(val);
    const bytes: number[] = [];
    while (v >= 0x80) {
      bytes.push((v & 0x7f) | 0x80);
      v = Math.floor(v / 128);
    }
    bytes.push(v & 0x7f);
    this.chunks.push(new Uint8Array(bytes));
  }

  writeTag(fieldNumber: number, wireType: number) {
    this.writeVarint((fieldNumber << 3) | wireType);
  }

  writeInt64(fieldNumber: number, val: number) {
    this.writeTag(fieldNumber, 0);
    this.writeVarint(val);
  }

  writeString(fieldNumber: number, str: string) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    this.writeTag(fieldNumber, 2);
    this.writeVarint(bytes.length);
    this.chunks.push(bytes);
  }

  writeBytes(fieldNumber: number, bytes: Uint8Array) {
    this.writeTag(fieldNumber, 2);
    this.writeVarint(bytes.length);
    this.chunks.push(bytes);
  }

  writeMessage(fieldNumber: number, subWriter: ProtoWriter) {
    const subBytes = subWriter.toUint8Array();
    this.writeTag(fieldNumber, 2);
    this.writeVarint(subBytes.length);
    this.chunks.push(subBytes);
  }

  toUint8Array(): Uint8Array {
    let totalLen = 0;
    for (const c of this.chunks) totalLen += c.length;
    const out = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of this.chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return out;
  }
}

/**
 * Creates TensorProto for 2D or 1D float weights
 */
function createTensorProto(name: string, dims: number[], rawFloats: number[]): ProtoWriter {
  const tp = new ProtoWriter();
  // 1: dims (repeated int64)
  for (const d of dims) {
    tp.writeInt64(1, d);
  }
  // 2: data_type (1 = FLOAT)
  tp.writeInt64(2, 1);
  // 7: raw_data (bytes: little-endian float32)
  const floatBuf = new Float32Array(rawFloats);
  const rawBytes = new Uint8Array(floatBuf.buffer);
  tp.writeBytes(7, rawBytes);
  // 8: name (string)
  tp.writeString(8, name);
  return tp;
}

/**
 * Creates NodeProto for ONNX operators (Gemm, Relu, MatMul, Add)
 */
function createNodeProto(opType: string, inputs: string[], outputs: string[], name: string): ProtoWriter {
  const node = new ProtoWriter();
  for (const inp of inputs) {
    node.writeString(1, inp);
  }
  for (const out of outputs) {
    node.writeString(2, out);
  }
  node.writeString(3, name);
  node.writeString(4, opType);
  node.writeString(7, ''); // default domain
  return node;
}

/**
 * Creates ValueInfoProto for inputs/outputs
 */
function createValueInfoProto(name: string, shape: number[]): ProtoWriter {
  const vi = new ProtoWriter();
  vi.writeString(1, name);

  // TypeProto
  const typeProto = new ProtoWriter();
  // TensorType
  const tensorType = new ProtoWriter();
  tensorType.writeInt64(1, 1); // FLOAT

  // TensorShapeProto
  const shapeProto = new ProtoWriter();
  for (const d of shape) {
    const dim = new ProtoWriter();
    dim.writeInt64(1, d); // dim_value
    shapeProto.writeMessage(1, dim);
  }
  tensorType.writeMessage(2, shapeProto);
  typeProto.writeMessage(1, tensorType);
  vi.writeMessage(2, typeProto);

  return vi;
}

/**
 * Builds a complete ONNX ModelProto
 */
export function buildONNXModel(weights: NNWeights, modelName = 'Level_Process_ML_Model'): Uint8Array {
  // GraphProto
  const graph = new ProtoWriter();
  graph.writeString(2, modelName);

  // Initializers (weights & biases)
  const w1Flat = weights.W1.flat();
  const b1Flat = weights.b1;
  const w2Flat = weights.W2.flat();
  const b2Flat = weights.b2;
  const w3Flat = weights.W3.flat();
  const b3Flat = weights.b3;

  graph.writeMessage(5, createTensorProto('W1', [weights.W1.length, weights.W1[0]?.length || 2], w1Flat));
  graph.writeMessage(5, createTensorProto('b1', [b1Flat.length], b1Flat));
  graph.writeMessage(5, createTensorProto('W2', [weights.W2.length, weights.W2[0]?.length || 64], w2Flat));
  graph.writeMessage(5, createTensorProto('b2', [b2Flat.length], b2Flat));
  graph.writeMessage(5, createTensorProto('W3', [weights.W3.length, weights.W3[0]?.length || 64], w3Flat));
  graph.writeMessage(5, createTensorProto('b3', [b3Flat.length], b3Flat));

  // Graph Inputs
  graph.writeMessage(11, createValueInfoProto('input', [1, 2]));

  // Graph Outputs
  graph.writeMessage(12, createValueInfoProto('output', [1, 1]));

  // Nodes:
  // 1. Gemm (Linear 1: input * W1^T + b1)
  graph.writeMessage(1, createNodeProto('Gemm', ['input', 'W1', 'b1'], ['h1_pre'], 'gemm_1'));
  // 2. Relu
  graph.writeMessage(1, createNodeProto('Relu', ['h1_pre'], ['h1'], 'relu_1'));
  // 3. Gemm (Linear 2: h1 * W2^T + b2)
  graph.writeMessage(1, createNodeProto('Gemm', ['h1', 'W2', 'b2'], ['h2_pre'], 'gemm_2'));
  // 4. Relu
  graph.writeMessage(1, createNodeProto('Relu', ['h2_pre'], ['h2'], 'relu_2'));
  // 5. Gemm (Linear 3: h2 * W3^T + b3)
  graph.writeMessage(1, createNodeProto('Gemm', ['h2', 'W3', 'b3'], ['output'], 'gemm_3'));

  // ModelProto
  const model = new ProtoWriter();
  model.writeInt64(1, 8); // ir_version = 8
  model.writeString(2, 'Prosoft-V2 ML Engine'); // producer_name
  model.writeString(3, '2.0.0'); // producer_version
  model.writeString(4, 'ai.onnx'); // domain
  model.writeInt64(5, 1); // model_version

  // Graph
  model.writeMessage(7, graph);

  // Opset import (ai.onnx v17)
  const opset = new ProtoWriter();
  opset.writeString(1, '');
  opset.writeInt64(2, 17);
  model.writeMessage(8, opset);

  return model.toUint8Array();
}

/**
 * Triggers browser download of the generated .onnx file
 */
export function downloadONNXFile(weights: NNWeights, logicName: string): void {
  const binary = buildONNXModel(weights, `Level_Process_${logicName}_Model`);
  const blob = new Blob([binary as unknown as BlobPart], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Level_Trainer_${logicName}_Model.onnx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Triggers browser download of training dataset as an Excel-compatible CSV
 */
export function downloadDatasetAsExcel(
  data: { time: number; op: number; pv: number }[],
  inputType = 'step'
): void {
  if (!data || data.length === 0) return;
  const header = ['Sample', 'Time (s)', 'Controller Output OP (%)', 'Process Value PV (%)', 'Signal Type'];
  const rows = data.map((d, i) => [
    i + 1,
    d.time,
    d.op.toFixed(2),
    d.pv.toFixed(2),
    inputType.toUpperCase(),
  ]);

  const csvContent = '\uFEFF' + [header.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Level_Trainer_Dataset_${inputType}_${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

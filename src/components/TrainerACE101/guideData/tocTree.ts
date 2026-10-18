export interface TocItem {
  id: string;
  title: string;
  page: number;
  children?: TocItem[];
}

export const GUIDE_TOC: TocItem[] = [
  {
    "id": "toc-0-level-process-trainer",
    "title": "Level Process Trainer",
    "page": 1
  },
  {
    "id": "toc-1-table-of-contents",
    "title": "Table of contents",
    "page": 2
  },
  {
    "id": "toc-2-1-product-details",
    "title": "1. Product Details",
    "page": 4,
    "children": [
      {
        "id": "toc-3-1-1-description",
        "title": "1.1 Description",
        "page": 4
      },
      {
        "id": "toc-4-1-2-specification-details",
        "title": "1.2. Specification Details",
        "page": 5
      },
      {
        "id": "toc-5-1-3-p-i-diagram",
        "title": "1.3 P&I Diagram",
        "page": 5
      },
      {
        "id": "toc-6-1-4-component-details",
        "title": "1.4 Component Details",
        "page": 6
      },
      {
        "id": "toc-7-1-5-requirements",
        "title": "1.5 Requirements",
        "page": 6
      },
      {
        "id": "toc-8-1-6-warranty",
        "title": "1.6 Warranty",
        "page": 6
      }
    ]
  },
  {
    "id": "toc-9-2-process-control",
    "title": "2. Process Control",
    "page": 7,
    "children": [
      {
        "id": "toc-10-2-1-essentials-of-process-control",
        "title": "2.1 Essentials of Process Control",
        "page": 7
      },
      {
        "id": "toc-11-2-2-feedback-control",
        "title": "2.2 Feedback Control",
        "page": 10
      },
      {
        "id": "toc-12-2-3-controller-modes",
        "title": "2.3 Controller Modes",
        "page": 12
      },
      {
        "id": "toc-13-2-4-test-inputs-and-responses",
        "title": "2.4 Test Inputs and Responses",
        "page": 17
      },
      {
        "id": "toc-14-2-5-tuning-techniques",
        "title": "2.5 Tuning Techniques",
        "page": 21,
        "children": [
          {
            "id": "toc-15-2-5-1-open-loop-tuning-process-reaction-method",
            "title": "2.5.1 Open loop tuning (Process reaction method)",
            "page": 21
          },
          {
            "id": "toc-16-2-5-2-closed-loop-tuning-ultimate-gain-method",
            "title": "2.5.2 Closed loop tuning (Ultimate gain method)",
            "page": 22
          }
        ]
      },
      {
        "id": "toc-17-2-6-stability-analysis",
        "title": "2.6 Stability Analysis",
        "page": 23
      },
      {
        "id": "toc-18-2-7-mathematical-model",
        "title": "2.7 Mathematical Model",
        "page": 25
      }
    ]
  },
  {
    "id": "toc-19-3-software-interface-features",
    "title": "3. Software Interface & Features",
    "page": 28,
    "children": [
      {
        "id": "toc-20-3-1-device-connection",
        "title": "3.1 Device Connection",
        "page": 28
      },
      {
        "id": "toc-21-3-2-features",
        "title": "3.2 Features",
        "page": 29
      }
    ]
  },
  {
    "id": "toc-22-4-experiments",
    "title": "4. Experiments",
    "page": 32,
    "children": [
      {
        "id": "toc-23-4-1-study-of-level-transmitter-characteristics",
        "title": "4.1 Study of Level Transmitter Characteristics",
        "page": 33
      },
      {
        "id": "toc-24-4-2-open-loop-on-off-closed-loop-experiments",
        "title": "4.2 Open Loop, On-Off & Closed Loop Experiments",
        "page": 34,
        "children": [
          {
            "id": "toc-25-4-2-1-open-loop",
            "title": "4.2.1 Open Loop",
            "page": 37
          },
          {
            "id": "toc-26-4-2-2-on-off-control",
            "title": "4.2.2 On/Off Control",
            "page": 38
          },
          {
            "id": "toc-27-4-2-3-p-mode",
            "title": "4.2.3 P Mode",
            "page": 39
          },
          {
            "id": "toc-28-4-2-4-pi-mode",
            "title": "4.2.4 PI Mode",
            "page": 40
          },
          {
            "id": "toc-29-4-2-5-pd-mode",
            "title": "4.2.5 PD Mode",
            "page": 41
          },
          {
            "id": "toc-30-4-2-6-pid-mode",
            "title": "4.2.6 PID Mode",
            "page": 42
          },
          {
            "id": "toc-31-4-2-7-open-loop-tuning",
            "title": "4.2.7 Open Loop Tuning",
            "page": 43
          },
          {
            "id": "toc-32-4-2-8-closed-loop-tuning",
            "title": "4.2.8 Closed Loop Tuning",
            "page": 44
          }
        ]
      },
      {
        "id": "toc-33-4-3-empirical-model-estimation",
        "title": "4.3 Empirical Model Estimation",
        "page": 45
      }
    ]
  },
  {
    "id": "toc-34-5-component-specifications",
    "title": "5. Component Specifications",
    "page": 49,
    "children": [
      {
        "id": "toc-35-5-1-wika-pressure-transmitter",
        "title": "5.1 WIKA – Pressure Transmitter",
        "page": 49
      },
      {
        "id": "toc-36-5-2-delta-digital-temperature-indicating-controller-dtb9696cr",
        "title": "5.2 Delta – Digital Temperature Indicating Controller (DTB9696CR)",
        "page": 51
      },
      {
        "id": "toc-37-5-3-control-air-i-p-converter",
        "title": "5.3 Control Air – I/P Converter",
        "page": 52
      },
      {
        "id": "toc-38-5-4-pneucon-control-valve",
        "title": "5.4 Pneucon – Control Valve",
        "page": 53
      },
      {
        "id": "toc-39-5-5-eureka-rotameter",
        "title": "5.5 Eureka – Rotameter",
        "page": 55
      }
    ]
  },
  {
    "id": "toc-40-6-controller-settings-modbus-address",
    "title": "6. Controller Settings & Modbus Address",
    "page": 56,
    "children": [
      {
        "id": "toc-41-6-1-default-settings",
        "title": "6.1 Default Settings",
        "page": 56
      },
      {
        "id": "toc-42-6-2-modbus-addresses",
        "title": "6.2 Modbus Addresses",
        "page": 57
      }
    ]
  },
  {
    "id": "toc-43-7-about-us",
    "title": "7. About Us",
    "page": 58,
    "children": [
      {
        "id": "toc-44-7-1-introduction",
        "title": "7.1 Introduction",
        "page": 58
      },
      {
        "id": "toc-45-7-2-vision-and-values",
        "title": "7.2 Vision and Values",
        "page": 58
      },
      {
        "id": "toc-46-7-3-product-range",
        "title": "7.3 Product Range",
        "page": 58
      },
      {
        "id": "toc-47-7-4-customer-list",
        "title": "7.4 Customer List",
        "page": 62
      }
    ]
  }
];

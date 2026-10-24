import React from 'react';
import {
  StopConfirmModal,
  type StopConfirmModalProps,
} from '../common/StopConfirmModal';

export type SimACE401StopModalProps = StopConfirmModalProps;

export const SimACE401StopModal: React.FC<SimACE401StopModalProps> = (props) => {
  return <StopConfirmModal {...props} />;
};

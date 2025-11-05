import React, { useState, useEffect } from 'react';
import { Modal, Button, Typography } from 'antd';

const { Text } = Typography;

interface ErrorInfo {
  message: string;
  stack?: string;
}

const ErrorHandler: React.FC = () => {
  const [errorInfo, setErrorInfo] = useState<ErrorInfo | null>(null);

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setErrorInfo({
        message: event.message,
        stack: event.error?.stack,
      });
      event.preventDefault();
    };

    const handlePromiseRejection = (event: PromiseRejectionEvent) => {
      setErrorInfo({
        message: event.reason?.message || '发生了一个 Promise 拒绝错误',
        stack: event.reason?.stack,
      });
      event.preventDefault();
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseRejection);
    };
  }, []);

  const handleClose = () => {
    setErrorInfo(null);
  };

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <Modal
      title="发生了一个意外错误"
      visible={!!errorInfo}
      onCancel={handleClose}
      footer={[
        <Button key="close" onClick={handleClose}>
          关闭
        </Button>,
        <Button key="reload" type="primary" onClick={handleReload}>
          重新加载应用
        </Button>,
      ]}
    >
      <Text type="danger">{errorInfo?.message}</Text>
      {errorInfo?.stack && (
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 200, overflowY: 'auto', background: '#f5f5f5', padding: 10, marginTop: 10 }}>
          {errorInfo.stack}
        </pre>
      )}
    </Modal>
  );
};

export default ErrorHandler;

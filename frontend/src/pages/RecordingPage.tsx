import type { FC } from 'react';
import { Typography, Space } from 'antd';
import RecordButton from '../components/RecordButton';

const { Title, Paragraph } = Typography;

const RecordingPage: FC = () => {
  return (
    <div style={{ textAlign: 'center', paddingTop: '50px' }}>
      <Space direction="vertical" size="large">
        <Title level={2}>准备好开始记录您的工作流了吗？</Title>
        <Paragraph>
          点击下方的“开始录制”按钮，应用将开始捕捉您的屏幕活动。
          <br />
          完成工作后，点击“停止并分析”以生成您的工作总结。
        </Paragraph>
        <RecordButton />
      </Space>
    </div>
  );
};

export default RecordingPage;


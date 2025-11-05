import React, { useState } from 'react';
import { Typography, Space, Input, Button, message } from 'antd';
import PromptManager from '../components/PromptManager'; // Import the new component
import { useUserStore } from '../stores/userStore';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const { apiKey, setApiKey } = useUserStore();
  const [localApiKey, setLocalApiKey] = useState(apiKey);

  const handleSaveApiKey = () => {
    setApiKey(localApiKey);
    message.success('API 密钥已保存!');
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Title level={2}>设置</Title>
      <Text>在这里管理您的应用设置和自定义提示。</Text>

      <Title level={4}>Gemini API 密钥</Title>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          type="password"
          placeholder="请输入您的 Gemini API 密钥"
          value={localApiKey}
          onChange={(e) => setLocalApiKey(e.target.value)}
        />
        <Button type="primary" onClick={handleSaveApiKey}>保存</Button>
      </Space.Compact>

      <PromptManager />
    </Space>
  );
};

export default SettingsPage;


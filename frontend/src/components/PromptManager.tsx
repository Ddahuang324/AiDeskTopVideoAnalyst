import { useState, type FC } from 'react';
import { Card, Typography, Button, List, Modal, Form, Input, message } from 'antd';
import { usePromptStore } from '../stores/promptStore';
import type { CustomPrompt } from '../types';

const { Text } = Typography;

const PromptManager: FC = () => {
  const { prompts, addPrompt, updatePrompt, deletePrompt } = usePromptStore();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<CustomPrompt | null>(null);
  const [form] = Form.useForm();

  const showModal = (prompt?: CustomPrompt) => {
    setEditingPrompt(prompt || null);
    form.setFieldsValue(prompt || { name: '', promptText: '' });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingPrompt) {
        updatePrompt(editingPrompt.id, { ...editingPrompt, ...values });
        message.success('提示更新成功');
      } else {
        addPrompt({ ...values, id: '', createdAt: new Date(), updatedAt: new Date(), isDefault: false });
        message.success('提示创建成功');
      }
      setIsModalVisible(false);
      form.resetFields();
    } catch (errorInfo) {
      console.log('Failed:', errorInfo);
      message.error('保存失败，请检查输入');
    }
  };

  const handleDelete = (id: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '您确定要删除此提示吗？',
      onOk: () => {
        deletePrompt(id);
        message.success('提示删除成功');
      },
    });
  };

  return (
    <>
      <Card title="自定义提示管理" extra={<Button type="primary" onClick={() => showModal()}>创建新提示</Button>}>
        <List
          itemLayout="horizontal"
          dataSource={prompts}
          renderItem={(item) => (
            <List.Item
              actions={[
                <Button type="link" onClick={() => showModal(item)}>编辑</Button>,
                <Button type="link" danger onClick={() => handleDelete(item.id)}>删除</Button>,
              ]}
            >
              <List.Item.Meta
                title={<Text strong>{item.name}</Text>}
                description={<Text ellipsis>{item.promptText}</Text>}
              />
            </List.Item>
          )}
        />
      </Card>

      <Modal
        title={editingPrompt ? '编辑提示' : '创建新提示'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={handleCancel}
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" name="prompt_form">
          <Form.Item
            name="name"
            label="提示名称"
            rules={[{ required: true, message: '请输入提示名称!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="promptText"
            label="提示内容"
            rules={[{ required: true, message: '请输入提示内容!' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default PromptManager;

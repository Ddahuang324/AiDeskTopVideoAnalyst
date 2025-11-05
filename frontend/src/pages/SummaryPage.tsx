import type { FC } from 'react';
import { Card, Typography, Space, Spin } from 'antd';
import { useSummaryStore } from '../stores/summaryStore';
import ActivityCard from '../components/ActivityCard';

const { Title, Text } = Typography;

const SummaryPage: FC = () => {
  const { summary } = useSummaryStore();

  if (!summary) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="正在加载总结..." />
        <Text style={{ display: 'block', marginTop: 20 }}>
          如果没有出现总结，请返回录制页面重新开始。
        </Text>
      </div>
    );
  }

  // A simple check to see if the summary is a string or an object
  const isSimpleSummary = typeof summary.summary === 'string';

  return (
    <div>
      <Title level={2}>工作流总结</Title>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Card title="AI 分析结果">
          {isSimpleSummary ? (
            <Text>{summary.summary}</Text>
          ) : (
            <Text>无法显示复杂的总结对象。</Text>
          )}
        </Card>

        {/* The detailed activity card display can be re-enabled once the AI returns structured data */}
        {/* <Title level={3}>活动详情</Title>
        {summary.activityCards && summary.activityCards.length > 0 ? (
          summary.activityCards.map((card, index) => (
            <ActivityCard key={index} card={card} />
          ))
        ) : (
          <Text>无活动详情。</Text>
        )} */}
      </Space>
    </div>
  );
};

export default SummaryPage;


import type { FC } from 'react';
import { Card, Typography, Tag, Space } from 'antd';
import type { ActivityCardData } from '../types';

const { Title } = Typography;

interface ActivityCardProps {
  card: ActivityCardData;
}

const ActivityCard: FC<ActivityCardProps> = ({ card }) => {
  return (
    <Card
      title={
        <Space>
          <Title level={5} style={{ margin: 0 }}>{card.title}</Title>
          <Tag color="blue">{card.category}</Tag>
          {card.subcategory && <Tag color="geekblue">{card.subcategory}</Tag>}
        </Space>
      }
      style={{ marginBottom: 16 }}
    >
      <p><strong>时间:</strong> {card.startTime} - {card.endTime}</p>
      <p><strong>简要总结:</strong> {card.summary}</p>
      <p><strong>详细总结:</strong> {card.detailedSummary}</p>
      {card.appSites && (
        <p><strong>应用/网站:</strong> {card.appSites.primary} {card.appSites.secondary ? `(${card.appSites.secondary})` : ''}</p>
      )}
      {card.distractions && card.distractions.length > 0 && (
        <div>
          <p><strong>分心事件:</strong></p>
          <ul>
            {card.distractions.map((distraction, dIndex) => (
              <li key={dIndex}>{distraction.type} ({distraction.duration}秒)</li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};

export default ActivityCard;

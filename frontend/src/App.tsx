import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Layout, Menu } from 'antd';
import RecordingPage from './pages/RecordingPage';
import SummaryPage from './pages/SummaryPage';
import SettingsPage from './pages/SettingsPage';
import ErrorHandler from './components/ErrorHandler';
import './App.css';

const { Header, Content, Footer } = Layout;

function App() {
  console.log('App component rendered');
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <ErrorHandler />
        <Header>
          <div className="logo" />
          <Menu theme="dark" mode="horizontal" defaultSelectedKeys={['1']}>
            <Menu.Item key="1">
              <Link to="/">录制</Link>
            </Menu.Item>
            <Menu.Item key="2">
              <Link to="/summary">总结</Link>
            </Menu.Item>
            <Menu.Item key="3">
              <Link to="/settings">设置</Link>
            </Menu.Item>
          </Menu>
        </Header>
        <Content style={{ padding: '0 50px', marginTop: 64 }}>
          <div className="site-layout-background" style={{ padding: 24, minHeight: 380 }}>
            <Routes>
              <Route path="/" element={<RecordingPage />} />
              <Route path="/summary" element={<SummaryPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}>Dayflow ©2025 Created by Gemini</Footer>
      </Layout>
    </Router>
  );
}

export default App;


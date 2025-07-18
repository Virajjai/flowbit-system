import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../services/AuthContext';
import { useSocket } from '../services/SocketContext';
import { apiService } from '../services/apiService';

const DashboardContainer = styled.div`
  display: flex;
  height: 100vh;
`;

const Sidebar = styled.nav`
  width: 250px;
  background-color: ${({ theme }) => theme.colors.secondary};
  color: white;
  padding: ${({ theme }) => theme.spacing.md};
`;

const SidebarHeader = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: ${({ theme }) => theme.spacing.md};
`;

const TenantName = styled.h2`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
`;

const UserInfo = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  opacity: 0.8;
`;

const NavList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

const NavItem = styled.li`
  margin-bottom: ${({ theme }) => theme.spacing.sm};
`;

const NavLink = styled.a`
  color: white;
  text-decoration: none;
  display: block;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: 4px;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: white;
  }
`;

const LogoutButton = styled.button`
  background-color: ${({ theme }) => theme.colors.warning};
  color: white;
  padding: ${({ theme }) => theme.spacing.sm};
  border-radius: 4px;
  width: 100%;
  margin-top: ${({ theme }) => theme.spacing.lg};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.error};
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: ${({ theme }) => theme.spacing.lg};
  background-color: ${({ theme }) => theme.colors.background};
`;

const WelcomeMessage = styled.div`
  background-color: ${({ theme }) => theme.colors.surface};
  padding: ${({ theme }) => theme.spacing.lg};
  border-radius: 8px;
  box-shadow: ${({ theme }) => theme.shadows.md};
  margin-bottom: ${({ theme }) => theme.spacing.lg};
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { socket, connected } = useSocket();
  const [screens, setScreens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tenantInfo, setTenantInfo] = useState(null);

  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const response = await apiService.getScreens();
        setScreens(response.data.screens);
        setTenantInfo(response.data.tenant);
      } catch (error) {
        console.error('Error fetching screens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchScreens();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('ticket-created', (ticket) => {
        console.log('New ticket created:', ticket);
        // You could show a notification here
      });

      socket.on('ticket-updated', (ticket) => {
        console.log('Ticket updated:', ticket);
        // You could update the UI here
      });

      socket.on('ticket-workflow-completed', (data) => {
        console.log('Workflow completed:', data);
        // You could show a notification here
      });

      return () => {
        socket.off('ticket-created');
        socket.off('ticket-updated');
        socket.off('ticket-workflow-completed');
      };
    }
  }, [socket]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return <LoadingSpinner>Loading dashboard...</LoadingSpinner>;
  }

  return (
    <DashboardContainer>
      <Sidebar>
        <SidebarHeader>
          <TenantName>{tenantInfo?.name || 'Flowbit'}</TenantName>
          <UserInfo>
            {user?.firstName} {user?.lastName}
            <br />
            <small>{user?.role}</small>
          </UserInfo>
        </SidebarHeader>
        
        <NavList>
          <NavItem>
            <NavLink href="/dashboard">Dashboard</NavLink>
          </NavItem>
          {screens.map((screen) => (
            <NavItem key={screen.id}>
              <NavLink href={screen.route}>{screen.name}</NavLink>
            </NavItem>
          ))}
          {user?.role === 'Admin' && (
            <NavItem>
              <NavLink href="/admin">Admin Panel</NavLink>
            </NavItem>
          )}
        </NavList>
        
        <LogoutButton onClick={handleLogout}>
          Logout
        </LogoutButton>
      </Sidebar>
      
      <MainContent>
        <Routes>
          <Route path="/dashboard" element={
            <WelcomeMessage>
              <h1>Welcome to Flowbit System</h1>
              <p>You are logged in as <strong>{user?.firstName} {user?.lastName}</strong></p>
              <p>Tenant: <strong>{tenantInfo?.name}</strong></p>
              <p>Role: <strong>{user?.role}</strong></p>
              <div style={{ marginTop: '1rem' }}>
                <small>
                  Socket Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
                </small>
              </div>
            </WelcomeMessage>
          } />
          <Route path="/tickets" element={
            <div>
              <h2>Support Tickets</h2>
              <iframe 
                src="http://localhost:3002" 
                style={{
                  width: '100%',
                  height: '600px',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                title="Support Tickets App"
              />
            </div>
          } />
          <Route path="/admin" element={
            user?.role === 'Admin' ? (
              <div>
                <h2>Admin Panel</h2>
                <p>Admin-only content for {tenantInfo?.name}</p>
                <p>This demonstrates RBAC - only admins can access this route.</p>
              </div>
            ) : (
              <div>
                <h2>Access Denied</h2>
                <p>You don't have permission to access this area.</p>
              </div>
            )
          } />
          <Route path="/*" element={
            <WelcomeMessage>
              <h1>Welcome to Flowbit System</h1>
              <p>You are logged in as <strong>{user?.firstName} {user?.lastName}</strong></p>
              <p>Tenant: <strong>{tenantInfo?.name}</strong></p>
              <p>Role: <strong>{user?.role}</strong></p>
              <div style={{ marginTop: '1rem' }}>
                <small>
                  Socket Status: {connected ? '🟢 Connected' : '🔴 Disconnected'}
                </small>
              </div>
            </WelcomeMessage>
          } />
        </Routes>
      </MainContent>
    </DashboardContainer>
  );
};

export default Dashboard;

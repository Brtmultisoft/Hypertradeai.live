import { useState } from 'react';
import {
  Box,
  Container,
  Card,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import PageHeader from '../../components/common/PageHeader';
import ProfileSettings from '../../components/settings/ProfileSettings';
import PasswordSettings from '../../components/settings/PasswordSettings';
import SecuritySettings from '../../components/settings/SecuritySettings';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

// Tab panel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Tab props
function a11yProps(index) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

const Settings = () => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg">
      <PageHeader
        title="Account Settings"
        subtitle="Manage your profile, password, and security settings"
        icon="settings"
      />

      <Card
        sx={{
          borderRadius: 2,
          boxShadow: mode === 'dark' ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'fullWidth' : 'standard'}
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'center',
                textTransform: 'none',
                fontWeight: 'medium',
                fontSize: isMobile ? '0.8rem' : '0.9rem',
                px: isMobile ? 1 : 3,
              },
              '& .MuiSvgIcon-root': {
                mr: isMobile ? 0 : 1,
                mb: isMobile ? 0.5 : 0,
              },
            }}
          >
            <Tab
              icon={<PersonIcon />}
              label="Profile"
              {...a11yProps(0)}
            />
            <Tab
              icon={<LockIcon />}
              label="Password"
              {...a11yProps(1)}
            />
            <Tab
              icon={<SecurityIcon />}
              label="Security"
              {...a11yProps(2)}
            />
          </Tabs>
        </Box>

        <TabPanel value={activeTab} index={0}>
          <ProfileSettings />
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          <PasswordSettings />
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          <SecuritySettings />
        </TabPanel>
      </Card>
    </Container>
  );
};

export default Settings;

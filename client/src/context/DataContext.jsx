import React, { createContext, useState, useEffect, useCallback } from 'react';
import DashboardService from '../services/dashboard.service';
import UserService from '../services/user.service';
import TeamService from '../services/team.service';
import InvestmentService from '../services/investment.service';
import IncomeService from '../services/income.service';

// Create the context
export const DataContext = createContext();

// Create the provider component
export const DataProvider = ({ children }) => {
  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [dashboardError, setDashboardError] = useState(null);

  // User profile data
  const [userData, setUserData] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [userError, setUserError] = useState(null);

  // Team data
  const [teamData, setTeamData] = useState(null);
  const [loadingTeam, setLoadingTeam] = useState(false);
  const [teamError, setTeamError] = useState(null);

  // Investment data
  const [investmentData, setInvestmentData] = useState(null);
  const [loadingInvestment, setLoadingInvestment] = useState(false);
  const [investmentError, setInvestmentError] = useState(null);

  // Income data
  const [incomeData, setIncomeData] = useState(null);
  const [loadingIncome, setLoadingIncome] = useState(false);
  const [incomeError, setIncomeError] = useState(null);

  // Last update timestamp
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    // Check if token exists before making API call
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping dashboard data fetch');
      setDashboardData(null);
      setLoadingDashboard(false);
      return;
    }

    setLoadingDashboard(true);
    setDashboardError(null);
    try {
      const response = await DashboardService.getDashboardData();
      console.log('Dashboard data fetched successfully:', response);
      setDashboardData(response.result);
      setLastUpdate(Date.now());
    } catch (error) {
      // Don't set error if it's a cancelled request
      if (error.message !== 'No authentication token') {
        setDashboardError(error.message || 'Failed to fetch dashboard data');
        console.error('Error fetching dashboard data:', error);
      }
    } finally {
      setLoadingDashboard(false);
    }
  }, []);

  // Fetch user profile data
  const fetchUserData = useCallback(async () => {
    // Check if token exists before making API call
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, skipping user profile fetch');
      setUserData(null);
      setLoadingUser(false);
      return;
    }

    setLoadingUser(true);
    setUserError(null);
    try {
      const response = await UserService.getUserProfile();
      console.log('User profile fetched successfully');
      setUserData(response.data);
      setLastUpdate(Date.now());
    } catch (error) {
      // Don't set error if it's a cancelled request
      if (error.message !== 'No authentication token') {
        setUserError(error.message || 'Failed to fetch user data');
        console.error('Error fetching user data:', error);
      }
    } finally {
      setLoadingUser(false);
    }
  }, []);

  // Fetch team data
  const fetchTeamData = useCallback(async () => {
    setLoadingTeam(true);
    setTeamError(null);
    try {
      const response = await TeamService.getDirectTeam();
      setTeamData(response.result);
      setLastUpdate(Date.now());
    } catch (error) {
      setTeamError(error.message || 'Failed to fetch team data');
      console.error('Error fetching team data:', error);
    } finally {
      setLoadingTeam(false);
    }
  }, []);

  // Fetch investment data
  const fetchInvestmentData = useCallback(async () => {
    setLoadingInvestment(true);
    setInvestmentError(null);
    try {
      const response = await InvestmentService.getAllInvestments();
      setInvestmentData(response.data);
      setLastUpdate(Date.now());
    } catch (error) {
      setInvestmentError(error.message || 'Failed to fetch investment data');
      console.error('Error fetching investment data:', error);
    } finally {
      setLoadingInvestment(false);
    }
  }, []);

  // Fetch income data
  const fetchIncomeData = useCallback(async () => {
    setLoadingIncome(true);
    setIncomeError(null);
    try {
      const response = await IncomeService.getAllIncomes();
      setIncomeData(response.data);
      setLastUpdate(Date.now());
    } catch (error) {
      setIncomeError(error.message || 'Failed to fetch income data');
      console.error('Error fetching income data:', error);
    } finally {
      setLoadingIncome(false);
    }
  }, []);

  // Refresh all data
  const refreshAllData = useCallback(() => {
    // Check if token exists before making API calls
    const token = localStorage.getItem('token');

    if (token) {
      console.log('Token exists, refreshing all data');
      fetchDashboardData();
      fetchUserData();
      fetchTeamData();
      fetchInvestmentData();
      fetchIncomeData();
    } else {
      console.log('No token found, skipping data refresh');
    }
  }, [fetchDashboardData, fetchUserData, fetchTeamData, fetchInvestmentData, fetchIncomeData]);

  // Initialize data on component mount
  useEffect(() => {
    // Check if token exists before making API calls
    const token = localStorage.getItem('token');

    if (token) {
      console.log('Token exists, fetching initial data');
      // Fetch all data immediately on mount
      fetchDashboardData();
      fetchUserData();
      fetchTeamData();
      fetchInvestmentData();
      fetchIncomeData();

      // Set up polling for automatic refresh (every 5 minutes - increased from 30 seconds)
      const pollingInterval = setInterval(() => {
        // Check token again before each poll
        if (localStorage.getItem('token')) {
          fetchDashboardData();
          fetchUserData(); // Also refresh user data to get updated invitation code/sponsor ID
        } else {
          // Clear interval if token is gone
          clearInterval(pollingInterval);
        }
      }, 300000); // 5 minutes in milliseconds (increased from 30000)

      return () => clearInterval(pollingInterval);
    } else {
      console.log('No token found, skipping data fetch');
    }
  }, [fetchDashboardData, fetchUserData, fetchTeamData, fetchInvestmentData, fetchIncomeData]);

  // Listen for data update events
  useEffect(() => {

    // Listen for investment-related actions
    document.addEventListener('investmentCreated', refreshAllData);
    document.addEventListener('investmentUpdated', refreshAllData);
    document.addEventListener('transferCompleted', refreshAllData);

    // Clean up event listeners
    return () => {
      document.removeEventListener('investmentCreated', refreshAllData);
      document.removeEventListener('investmentUpdated', refreshAllData);
      document.removeEventListener('transferCompleted', refreshAllData);
    };
  }, [refreshAllData]);

  // Provide the context value
  const contextValue = {
    // Dashboard data
    dashboardData,
    loadingDashboard,
    dashboardError,
    fetchDashboardData,

    // User data
    userData,
    loadingUser,
    userError,
    fetchUserData,

    // Team data
    teamData,
    loadingTeam,
    teamError,
    fetchTeamData,

    // Investment data
    investmentData,
    loadingInvestment,
    investmentError,
    fetchInvestmentData,

    // Income data
    incomeData,
    loadingIncome,
    incomeError,
    fetchIncomeData,

    // General
    lastUpdate,
    refreshAllData,

    // Helper function to trigger data update events
    triggerUpdate: (eventType) => {
      const event = new Event(eventType);
      document.dispatchEvent(event);
    }
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

// Custom hook to use the data context
export const useData = () => {
  const context = React.useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

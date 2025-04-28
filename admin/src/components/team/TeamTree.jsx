import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  Chip,
  useTheme,
  styled,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  Email as EmailIcon,
  AccountBalanceWallet as WalletIcon,
  CalendarToday as CalendarTodayIcon,
} from '@mui/icons-material';

// Styled components
const NodeCard = styled(Card)(({ theme, level, isHighlighted }) => ({
  borderRadius: theme.shape.borderRadius * 1.5,
  border: `1px solid ${isHighlighted ? theme.palette.primary.main : theme.palette.divider}`,
  boxShadow: isHighlighted ? `0 0 0 2px ${theme.palette.primary.main}` : 'none',
  transition: 'all 0.3s ease',
  backgroundColor: level === 0 
    ? `${theme.palette.primary.main}10` 
    : theme.palette.background.paper,
  '&:hover': {
    borderColor: theme.palette.primary.main,
    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.1)`,
  },
}));

const NodeAvatar = styled(Avatar)(({ theme, level }) => ({
  width: 40,
  height: 40,
  backgroundColor: level === 0 ? theme.palette.primary.main : theme.palette.secondary.main,
  color: '#fff',
  fontWeight: 'bold',
  marginRight: theme.spacing(1.5),
}));

const TeamTree = ({ data, onMemberClick, searchTerm, expandAll }) => {
  const theme = useTheme();
  const [expandedNodes, setExpandedNodes] = useState({});
  const [filteredData, setFilteredData] = useState(data);

  // Initialize expanded nodes when data changes or expandAll changes
  useEffect(() => {
    if (data) {
      if (expandAll) {
        // Create an object with all nodes expanded
        const expandAllNodes = (node, result = {}) => {
          if (!node) return result;
          result[node.id] = true;
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => expandAllNodes(child, result));
          }
          return result;
        };
        setExpandedNodes(expandAllNodes(data));
      } else {
        // By default, expand only the root node
        setExpandedNodes({ [data.id]: true });
      }
    }
  }, [data, expandAll]);

  // Filter data based on search term
  useEffect(() => {
    if (!data || !searchTerm) {
      setFilteredData(data);
      return;
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Helper function to check if a node or any of its descendants match the search
    const nodeMatchesSearch = (node) => {
      if (!node) return false;
      
      // Check if current node matches
      const nameMatch = node.name?.toLowerCase().includes(searchLower);
      const usernameMatch = node.username?.toLowerCase().includes(searchLower);
      const emailMatch = node.email?.toLowerCase().includes(searchLower);
      
      if (nameMatch || usernameMatch || emailMatch) return true;
      
      // Check if any children match
      if (node.children && node.children.length > 0) {
        return node.children.some(child => nodeMatchesSearch(child));
      }
      
      return false;
    };

    // Clone data and filter out non-matching branches
    const filterNodes = (node) => {
      if (!node) return null;
      
      const nodeMatches = nodeMatchesSearch(node);
      if (!nodeMatches) return null;
      
      // If this node matches directly, include it and all its children
      const directMatch = 
        node.name?.toLowerCase().includes(searchLower) ||
        node.username?.toLowerCase().includes(searchLower) ||
        node.email?.toLowerCase().includes(searchLower);
      
      if (directMatch) {
        return { ...node };
      }
      
      // Otherwise, filter children and only include matching branches
      const filteredChildren = node.children
        ?.map(child => filterNodes(child))
        .filter(Boolean);
      
      return {
        ...node,
        children: filteredChildren || []
      };
    };
    
    const filtered = filterNodes(data);
    setFilteredData(filtered);
    
    // Expand nodes that match the search
    if (filtered) {
      const expandMatchingNodes = (node, result = {}) => {
        if (!node) return result;
        
        const directMatch = 
          node.name?.toLowerCase().includes(searchLower) ||
          node.username?.toLowerCase().includes(searchLower) ||
          node.email?.toLowerCase().includes(searchLower);
        
        if (directMatch) {
          result[node.id] = true;
        }
        
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => {
            const childMatches = expandMatchingNodes(child, result);
            if (Object.keys(childMatches).length > 0) {
              result[node.id] = true; // Expand parent if any child matches
            }
          });
        }
        
        return result;
      };
      
      setExpandedNodes(prev => ({
        ...prev,
        ...expandMatchingNodes(filtered)
      }));
    }
  }, [data, searchTerm]);

  // Toggle node expansion
  const toggleNode = (nodeId, e) => {
    if (e) e.stopPropagation();
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null) return '$0.00';
    return `$${parseFloat(amount).toFixed(2)}`;
  };

  // Render a tree node
  const renderNode = (node, level = 0) => {
    if (!node) return null;

    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isHighlighted = searchTerm && (
      (node.name && node.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (node.username && node.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (node.email && node.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
      <Box key={node.id} sx={{ mb: 2, ml: level > 0 ? 4 : 0 }}>
        <NodeCard level={level} isHighlighted={isHighlighted}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <NodeAvatar level={level}>
                  {node.name ? node.name.charAt(0).toUpperCase() : <PersonIcon />}
                </NodeAvatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                    {node.name || 'Unknown'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                    <EmailIcon fontSize="small" sx={{ mr: 0.5, fontSize: 14 }} />
                    {node.email || 'No email'}
                  </Typography>
                </Box>
              </Box>
              {hasChildren && (
                <IconButton 
                  size="small" 
                  onClick={(e) => toggleNode(node.id, e)}
                  sx={{ ml: 1 }}
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              )}
            </Box>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              <Chip
                size="small"
                icon={<WalletIcon fontSize="small" />}
                label={`${formatCurrency(node.investment)}`}
                sx={{ borderRadius: 1 }}
              />
              <Chip
                size="small"
                icon={<CalendarTodayIcon fontSize="small" />}
                label={`Joined: ${formatDate(node.joinDate)}`}
                sx={{ borderRadius: 1 }}
              />
              {hasChildren && (
                <Chip
                  size="small"
                  icon={<GroupsIcon fontSize="small" />}
                  label={`${node.children.length} referrals`}
                  sx={{ borderRadius: 1 }}
                />
              )}
            </Box>
            
            <Box 
              sx={{ 
                mt: 1.5, 
                display: 'flex', 
                justifyContent: 'flex-end' 
              }}
            >
              <Typography
                variant="body2"
                color="primary"
                sx={{ 
                  cursor: 'pointer',
                  '&:hover': { textDecoration: 'underline' }
                }}
                onClick={() => onMemberClick && onMemberClick(node)}
              >
                View Details
              </Typography>
            </Box>
          </CardContent>
        </NodeCard>

        {/* Render children if expanded */}
        {hasChildren && isExpanded && (
          <Box sx={{ position: 'relative' }}>
            {/* Vertical connector line */}
            <Box sx={{
              position: 'absolute',
              left: 20,
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: theme.palette.divider,
              zIndex: 0
            }} />
            
            {/* Child nodes */}
            <Box sx={{ pl: 4, pt: 2 }}>
              {node.children.map(child => (
                <Box key={child.id} sx={{ position: 'relative' }}>
                  {/* Horizontal connector line */}
                  <Box sx={{
                    position: 'absolute',
                    left: -24,
                    top: 20,
                    width: 24,
                    height: 2,
                    backgroundColor: theme.palette.divider,
                  }} />
                  {renderNode(child, level + 1)}
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>
    );
  };

  // Loading or empty state
  if (!filteredData) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 5,
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: 'transparent',
            border: `2px dashed ${theme.palette.divider}`,
            color: theme.palette.text.secondary,
            mb: 2,
          }}
        >
          <GroupsIcon />
        </Avatar>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Team Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, textAlign: 'center' }}>
          {searchTerm ? 'No users match your search criteria' : 'There are no users in the system yet'}
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      {renderNode(filteredData)}
    </Box>
  );
};

export default TeamTree;

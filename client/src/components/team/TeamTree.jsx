import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  Tooltip,
  IconButton,
  Skeleton,
  useTheme,
  Chip,
  styled,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
  Groups as GroupsIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';
import { useTheme as useAppTheme } from '../../context/ThemeContext';

// Styled components for Trust Wallet-like UI with mobile optimization
const NodeCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'rootNode' && prop !== 'nodeLevel' && prop !== 'darkMode'
})(({ theme, rootNode, nodeLevel, darkMode }) => ({
  width: '100%',
  borderRadius: 12,
  border: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.05)' : theme.palette.divider}`,
  backgroundColor: rootNode
    ? darkMode
      ? `rgba(51, 117, 187, 0.1)`
      : `rgba(51, 117, 187, 0.05)`
    : darkMode
      ? theme.palette.background.paper
      : '#FFFFFF',
  transition: 'all 0.3s ease',
  overflow: 'hidden',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: darkMode ? '0 8px 16px rgba(0, 0, 0, 0.2)' : '0 8px 16px rgba(0, 0, 0, 0.1)',
    borderColor: theme.palette.primary.main,
  },
  '&::before': rootNode ? {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '4px',
    height: '100%',
    background: `linear-gradient(to bottom, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
  } : {},
  [theme.breakpoints.down('sm')]: {
    maxWidth: `calc(100% - ${nodeLevel * 8}px)`,
    marginLeft: 'auto',
  },
}));

const NodeAvatar = styled(Avatar, {
  shouldForwardProp: (prop) => prop !== 'rootNode' && prop !== 'darkMode'
})(({ theme, rootNode, darkMode }) => ({
  width: rootNode ? 48 : 40,
  height: rootNode ? 48 : 40,
  backgroundColor: rootNode ? theme.palette.primary.main : theme.palette.background.default,
  color: rootNode ? '#fff' : theme.palette.text.primary,
  boxShadow: rootNode
    ? `0 0 0 4px ${darkMode ? 'rgba(51, 117, 187, 0.2)' : 'rgba(51, 117, 187, 0.1)'}`
    : 'none',
}));

const ExpandButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})((props) => {
  const { darkMode } = props;
  return {
    width: 28,
    height: 28,
    backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    '&:hover': {
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
  };
});

const TeamTree = ({ data, loading, onMemberClick }) => {
  const theme = useTheme();
  const { mode } = useAppTheme();
  const [expandedNodes, setExpandedNodes] = useState({});
  const isDarkMode = mode === 'dark';

  // Initialize expanded nodes when data changes
  useEffect(() => {
    if (data) {
      // By default, expand the root node only
      const initialExpanded = { [data.id]: true };
      setExpandedNodes(initialExpanded);
    }
  }, [data]);

  // Toggle node expansion
  const toggleNode = (nodeId, e) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Get rank color
  const getRankColor = (rank) => {
    switch (rank?.toUpperCase()) {
      case 'PRIME':
        return theme.palette.info.main;
      case 'VETERAN':
        return theme.palette.success.main;
      case 'ROYAL':
        return theme.palette.warning.main;
      case 'SUPREME':
        return theme.palette.error.main;
      default:
        return theme.palette.primary.main;
    }
  };

  // Recursive function to render a node and its children - Trust Wallet style
  const renderNode = (node, level = 0) => {
    if (!node) return null;

    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = level === 0;

    return (
      <Box key={node.id} sx={{ width: '100%', mb: 1.5 }}>
        <NodeCard
          rootNode={isRoot}
          nodeLevel={level}
          darkMode={isDarkMode}
          onClick={() => onMemberClick && onMemberClick(node)}
          sx={{ cursor: onMemberClick ? 'pointer' : 'default' }}
        >
          <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
            {/* Member Header */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: { xs: 'wrap', sm: 'nowrap' }
            }}>
              {/* User Info */}
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                width: { xs: '100%', sm: 'auto' },
                mb: { xs: 1, sm: 0 }
              }}>
                <NodeAvatar
                  rootNode={isRoot}
                  darkMode={isDarkMode}
                  src={node.avatar}
                >
                  {node.name?.charAt(0) || <PersonIcon />}
                </NodeAvatar>

                <Box sx={{ ml: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: { xs: 120, sm: 'none' } }}>
                      {node.name || 'User'}
                    </Typography>
                    {isRoot && (
                      <Tooltip title="You">
                        <VerifiedUserIcon
                          fontSize="small"
                          color="primary"
                          sx={{ fontSize: 16, opacity: 0.8 }}
                        />
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: { xs: 120, sm: 'none' } }}>
                    @{node.username || 'username'}
                  </Typography>
                </Box>
              </Box>

              {/* Investment & Rank */}
              <Box sx={{
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'column' },
                alignItems: { xs: 'center', sm: 'flex-end' },
                justifyContent: { xs: 'space-between', sm: 'flex-start' },
                width: { xs: '100%', sm: 'auto' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Typography
                  variant="body2"
                  fontWeight="medium"
                  sx={{
                    color: node.investment > 0 ? theme.palette.success.main : 'text.secondary',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {formatCurrency(node.investment || 0)}
                </Typography>

                <Chip
                  label={node.rank || 'Active'}
                  size="small"
                  sx={{
                    height: 20,
                    fontSize: '0.65rem',
                    mt: { xs: 0, sm: 0.5 },
                    bgcolor: `${getRankColor(node.rank)}20`,
                    color: getRankColor(node.rank),
                    fontWeight: 'medium',
                    borderRadius: 1
                  }}
                />
              </Box>

              {/* Expand Button */}
              {hasChildren && (
                <Box sx={{
                  position: { xs: 'absolute', sm: 'static' },
                  right: { xs: 12, sm: 'auto' },
                  top: { xs: 12, sm: 'auto' }
                }}>
                  <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
                    <ExpandButton
                      size="small"
                      darkMode={isDarkMode}
                      onClick={(e) => toggleNode(node.id, e)}
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </ExpandButton>
                  </Tooltip>
                </Box>
              )}
            </Box>

            {/* Children Count */}
            {hasChildren && (
              <Box sx={{
                mt: 1.5,
                pt: 1.5,
                borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.05)' : theme.palette.divider}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Typography variant="caption" color="text.secondary">
                  {node.children.length} {node.children.length === 1 ? 'member' : 'members'}
                </Typography>

                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.primary.main,
                    cursor: 'pointer',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                  onClick={(e) => toggleNode(node.id, e)}
                >
                  {isExpanded ? 'Hide members' : 'Show members'}
                </Typography>
              </Box>
            )}
          </CardContent>
        </NodeCard>

        {/* Children */}
        {hasChildren && isExpanded && (
          <Box sx={{
            pl: { xs: 2, sm: 3 },
            mt: 1,
            position: 'relative'
          }}>
            {/* Vertical connector line */}
            <Box sx={{
              position: 'absolute',
              left: { xs: 10, sm: 16 },
              top: 0,
              bottom: 0,
              width: 2,
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider,
              zIndex: 0
            }} />

            {/* Child nodes */}
            {node.children.map((child) => (
              <Box key={child.id} sx={{ position: 'relative', zIndex: 1 }}>
                {/* Horizontal connector line */}
                <Box sx={{
                  position: 'absolute',
                  left: { xs: 10, sm: 16 },
                  top: 20,
                  width: { xs: 10, sm: 16 },
                  height: 2,
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider,
                }} />

                {renderNode(
                  child,
                  level + 1
                )}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <Box>
        <Skeleton
          variant="rectangular"
          height={110}
          sx={{
            borderRadius: 3,
            mb: 2.5,
            opacity: isDarkMode ? 0.7 : 1,
            background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : undefined,
          }}
        />
        <Box sx={{ pl: { xs: 2, sm: 3 }, position: 'relative' }}>
          {/* Vertical connector */}
          <Box sx={{
            position: 'absolute',
            left: { xs: 10, sm: 16 },
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider,
          }} />

          {/* First child */}
          <Box sx={{ position: 'relative', mb: 2 }}>
            {/* Horizontal connector */}
            <Box sx={{
              position: 'absolute',
              left: { xs: 10, sm: 16 },
              top: 20,
              width: { xs: 10, sm: 16 },
              height: 2,
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider,
            }} />

            <Skeleton
              variant="rectangular"
              height={90}
              sx={{
                borderRadius: 3,
                opacity: isDarkMode ? 0.7 : 1,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : undefined,
                width: { xs: '95%', sm: '100%' },
                marginLeft: { xs: 'auto', sm: 0 },
                ml: { xs: 2, sm: 3 },
              }}
            />
          </Box>

          {/* Second child */}
          <Box sx={{ position: 'relative' }}>
            {/* Horizontal connector */}
            <Box sx={{
              position: 'absolute',
              left: { xs: 10, sm: 16 },
              top: 20,
              width: { xs: 10, sm: 16 },
              height: 2,
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider,
            }} />

            <Skeleton
              variant="rectangular"
              height={90}
              sx={{
                borderRadius: 3,
                opacity: isDarkMode ? 0.7 : 1,
                background: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : undefined,
                width: { xs: '95%', sm: '100%' },
                marginLeft: { xs: 'auto', sm: 0 },
                ml: { xs: 2, sm: 3 },
              }}
            />
          </Box>
        </Box>
      </Box>
    );
  }

  // No data
  if (!data) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 6,
          px: 3,
          borderRadius: 3,
          border: `1px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider}`,
          bgcolor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
        }}
      >
        <Avatar
          sx={{
            width: 60,
            height: 60,
            bgcolor: 'transparent',
            border: `2px dashed ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : theme.palette.divider}`,
            color: theme.palette.text.secondary,
            mx: 'auto',
            mb: 2,
          }}
        >
          <GroupsIcon />
        </Avatar>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Team Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 300, mx: 'auto' }}>
          Start building your team by sharing your referral link with others
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 0, sm: 2 },
      overflowX: 'hidden',
      width: '100%',
    }}>
      {renderNode(data)}
    </Box>
  );
};

export default TeamTree;

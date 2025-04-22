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
} from '@mui/material';
import {
  AccountCircle,
  Add as AddIcon,
  Remove as RemoveIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { formatCurrency } from '../../utils/formatters';

const TeamTree = ({ data, loading, onMemberClick }) => {
  const theme = useTheme();
  const [expandedNodes, setExpandedNodes] = useState({});

  // Initialize expanded nodes when data changes
  useEffect(() => {
    if (data) {
      // By default, expand the root node and its direct children
      const initialExpanded = { [data.id]: true };
      if (data.children) {
        data.children.forEach((child) => {
          initialExpanded[child.id] = true;
        });
      }
      setExpandedNodes(initialExpanded);
    }
  }, [data]);

  // Toggle node expansion
  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Recursive function to render a node and its children
  const renderNode = (node, level = 0, isLast = false, path = []) => {
    if (!node) return null;

    const isExpanded = expandedNodes[node.id];
    const hasChildren = node.children && node.children.length > 0;
    const isRoot = level === 0;

    return (
      <Box key={node.id} sx={{ position: 'relative' }}>
        {/* Connector lines */}
        {!isRoot && (
          <Box
            sx={{
              position: 'absolute',
              left: -20,
              top: 0,
              bottom: isLast ? 20 : '100%',
              width: 20,
              borderLeft: `2px solid ${theme.palette.divider}`,
              borderBottom: isLast ? `2px solid ${theme.palette.divider}` : 'none',
              zIndex: 1,
            }}
          />
        )}

        {/* Node */}
        <Box
          sx={{
            display: 'flex',
            mb: 2,
            ml: level * 4,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <Card
            elevation={0}
            sx={{
              width: '100%',
              borderRadius: 2,
              border: `1px solid ${theme.palette.divider}`,
              backgroundColor: isRoot
                ? `${theme.palette.primary.main}10`
                : theme.palette.background.paper,
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: onMemberClick ? 'pointer' : 'default',
              '&:hover': onMemberClick
                ? {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 8px rgba(0, 0, 0, 0.1)`,
                  }
                : {},
            }}
            onClick={() => onMemberClick && onMemberClick(node)}
          >
            <CardContent sx={{ p: 2 }}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                {/* User info */}
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {node.avatar ? (
                    <Avatar
                      src={node.avatar}
                      alt={node.name}
                      sx={{ width: 40, height: 40 }}
                    />
                  ) : (
                    <Avatar sx={{ width: 40, height: 40, bgcolor: theme.palette.primary.main }}>
                      <PersonIcon />
                    </Avatar>
                  )}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {node.name || 'User'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {node.username || 'username'}
                    </Typography>
                  </Box>
                </Box>

                {/* Investment info */}
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight="medium">
                    {formatCurrency(node.investment || 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {node.rank || 'Active'}
                  </Typography>
                </Box>

                {/* Expand/collapse button */}
                {hasChildren && (
                  <Tooltip title={isExpanded ? 'Collapse' : 'Expand'}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleNode(node.id);
                      }}
                      sx={{ ml: 1 }}
                    >
                      {isExpanded ? <RemoveIcon fontSize="small" /> : <AddIcon fontSize="small" />}
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Children */}
        {hasChildren && isExpanded && (
          <Box sx={{ ml: 4 }}>
            {node.children.map((child, index) =>
              renderNode(
                child,
                level + 1,
                index === node.children.length - 1,
                [...path, index]
              )
            )}
          </Box>
        )}
      </Box>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2, mb: 2 }} />
        <Box sx={{ ml: 4 }}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 2 }} />
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 2 }} />
        </Box>
        <Box sx={{ ml: 8 }}>
          <Skeleton variant="rectangular" height={60} sx={{ borderRadius: 2, mb: 2 }} />
        </Box>
      </Box>
    );
  }

  // No data
  if (!data) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 4,
          textAlign: 'center',
        }}
      >
        <AccountCircle sx={{ fontSize: 60, color: theme.palette.text.secondary, mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          No Team Data Available
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Start building your team by sharing your referral link.
        </Typography>
      </Box>
    );
  }

  return <Box sx={{ p: 2 }}>{renderNode(data)}</Box>;
};

export default TeamTree;

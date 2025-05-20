import React from 'react';
import { Grid as MuiGrid, GridProps as MuiGridProps } from '@mui/material';

interface CustomGridProps extends MuiGridProps {
  item?: boolean;
  container?: boolean;
  xs?: number | boolean;
  sm?: number | boolean;
  md?: number | boolean;
  lg?: number | boolean;
  xl?: number | boolean;
  spacing?: number | { xs?: number; sm?: number; md?: number; lg?: number; xl?: number };
}

const CustomGrid: React.FC<CustomGridProps> = (props) => {
  return <MuiGrid {...props} />;
};

export default CustomGrid;

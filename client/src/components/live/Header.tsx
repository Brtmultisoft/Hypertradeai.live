// import React from 'react';
// import { 
//   AppBar, 
//   Toolbar, 
//   Typography, 
//   IconButton, 
//   Box, 
//   useMediaQuery, 
//   useTheme, 
//   PaletteMode 
// } from '@mui/material';
// import { Moon, Sun, TrendingUp } from 'lucide-react';

// interface HeaderProps {
//   toggleColorMode: () => void;
//   mode: PaletteMode;
// }

// const Header: React.FC<HeaderProps> = ({ toggleColorMode, mode }) => {
//   const theme = useTheme();
//   const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

//   return (
//     <AppBar position="static" elevation={0} sx={{ 
//       backgroundColor: 'background.paper',
//       borderBottom: '1px solid',
//       borderColor: 'divider',
//     }}>
//       <Toolbar>
//         <Box display="flex" alignItems="center">
//           <TrendingUp size={28} color={theme.palette.primary.main} />
//           <Typography
//             variant={isMobile ? "h6" : "h5"}
//             component="div"
//             sx={{ 
//               ml: 1,
//               fontWeight: 700,
//               background: 'linear-gradient(45deg, #00E676 30%, #76FF03 90%)',
//               WebkitBackgroundClip: 'text',
//               WebkitTextFillColor: 'transparent',
//             }}
//           >
//             CryptoLive
//           </Typography>
//         </Box>
        
//         <Box sx={{ flexGrow: 1 }} />
        
//         <IconButton 
//           onClick={toggleColorMode} 
//           color="inherit"
//           aria-label="toggle dark mode"
//           sx={{ 
//             transition: 'transform 0.3s ease-in-out',
//             '&:hover': { transform: 'rotate(30deg)' }
//           }}
//         >
//           {mode === 'dark' ? <Sun /> : <Moon />}
//         </IconButton>
//       </Toolbar>
//     </AppBar>
//   );
// };

// export default Header;
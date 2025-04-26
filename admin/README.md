# HyperTrade Admin Panel

This is the admin panel for the HyperTrade MLMplatform. It provides a comprehensive interface for administrators to manage users, investments, income distributions, and wallet operations.

## Features

- **Dashboard**: Overview of platform statistics and quick actions
- **Team Management**: View and manage all users and their referral relationships
- **Investment Management**: Track all investments on the platform
- **Income Management**: Monitor daily ROI, level ROI, and direct income distributions
- **Wallet Management**: Transfer funds, view transfer history, deposits, and withdrawals

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the admin directory
3. Install dependencies:

```bash
npm install
# or
yarn install
```

4. Create a `.env` file in the root directory with the following content:

```
VITE_API_URL=http://localhost:5000
```

Replace the URL with your actual API endpoint.

### Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at http://localhost:3001.

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## Project Structure

- `src/`: Source code
  - `components/`: Reusable UI components
  - `context/`: React context providers
  - `hooks/`: Custom React hooks
  - `layouts/`: Page layout components
  - `pages/`: Application pages
    - `auth/`: Authentication pages
    - `dashboard/`: Dashboard pages
    - `team/`: Team management pages
    - `investment/`: Investment management pages
    - `income/`: Income management pages
    - `wallet/`: Wallet management pages
  - `utils/`: Utility functions
  - `App.jsx`: Main application component
  - `main.jsx`: Application entry point
  - `theme.js`: Material UI theme configuration

## Technologies Used

- React.js
- Material UI
- Vite
- Axios
- Chart.js
- React Router

## API Integration

The admin panel integrates with the HyperTrade API to fetch and manage data. All API requests include authentication tokens and follow RESTful principles.

## Authentication

The admin panel uses JWT-based authentication. Tokens are stored in localStorage and included in API requests via Authorization headers.

## Responsive Design

The admin panel is fully responsive and works on all screen sizes from mobile to desktop.

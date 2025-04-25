<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(-1);
$title = 'Trading Platform';
include_once 'header.php';

// Check if user is logged in
if (!isset($user)) {
    header("Location: login.php");
    exit;
}

// Handle trading status update
if (isset($_POST['update_status'])) {
    $status = (int)$_POST['status'];
    // Update user's trading status in the database
    my_query("UPDATE user SET trade_status = $status WHERE uid = $user->uid");

    //  echo json_encode(['success' => true, 'message' => 'Trading status updated successfully']);
    // Return success message if it's an AJAX request
    if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
        echo json_encode(['success' => true, 'message' => 'Trading status updated successfully']);
        exit;
    }
}

// Get user's trading status
$trade_active = $user->trade_status;
?>

<style>
/* Binance-inspired Dark Theme with Professional Trading UI */
body {
    background: #0c0e12;
    color: #eaecef;
    font-family: 'Inter', 'Roboto', sans-serif;
}
.content-header {
   display:none;
}
.live-trading-container {
    margin: 0;
    padding: 0;
    background: #161924;
    border: none;
    border-radius: 0;
    box-shadow: none;
    position: relative;
    overflow: hidden;
    max-width: 100%;
}

/* Coin Carousel Section */
.coin-carousel {
    display: flex;
    overflow-x: auto;
    padding: 15px 0;
    margin-bottom: 20px;
    background: #12151c;
    border-radius: 4px;
    scrollbar-width: none; /* Firefox */
}

.coin-carousel::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Edge */
}

.coin-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 120px;
    padding: 10px 15px;
    border-right: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s ease;
}

.coin-item:hover {
    background: rgba(255, 255, 255, 0.03);
}

.coin-logo {
    width: 24px;
    height: 24px;
    margin-bottom: 8px;
}

.coin-name {
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 5px;
}

.coin-price {
    font-size: 14px;
    font-weight: 600;
    font-family: 'Roboto Mono', monospace;
}

.coin-change {
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    margin-top: 5px;
}

.change-up {
    background: rgba(14, 203, 129, 0.1);
    color: #0ecb81;
}

.change-down {
    background: rgba(246, 70, 93, 0.1);
    color: #f6465d;
}

.live-trading-header {
    background: #12151c;
    padding: 15px 20px;
    border-radius: 4px;
    margin-bottom: 15px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
    position: relative;
}

.header-info {
    display: flex;
    align-items: center;
    gap: 15px;
}

.header-title {
    display: flex;
    align-items: center;
    gap: 10px;
}

.header-title h1 {
    font-size: 18px;
    font-weight: 500;
    margin: 0;
}

.trading-pair {
    display: flex;
    align-items: center;
    gap: 8px;
    background: rgba(255, 255, 255, 0.03);
    padding: 6px 12px;
    border-radius: 4px;
}

.pair-icon {
    width: 20px;
    height: 20px;
}

.pair-name {
    font-weight: 600;
    font-size: 16px;
}

#lastPrice {
    font-family: 'Roboto Mono', monospace;
    font-size: 18px;
    font-weight: 600;
    padding: 8px 15px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.2);
    position: relative;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
}

.price-change-indicator {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 12px;
    padding: 3px 8px;
    border-radius: 3px;
}

.price-up-indicator {
    background: rgba(14, 203, 129, 0.1);
    color: #0ecb81;
}

.price-down-indicator {
    background: rgba(246, 70, 93, 0.1);
    color: #f6465d;
}

/* Trading Layout */
.trading-layout {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 15px;
    margin-bottom: 15px;
}

/* Order Book Section */
.order-book {
    background: #12151c;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
    height: 500px;
    display: flex;
    flex-direction: column;
}

.order-book-header {
    padding: 12px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.order-book-title {
    font-size: 14px;
    font-weight: 500;
    color: #eaecef;
}

.order-book-controls {
    display: flex;
    gap: 8px;
}

.order-book-control {
    background: rgba(255, 255, 255, 0.03);
    border: none;
    color: #eaecef;
    padding: 4px 8px;
    border-radius: 2px;
    font-size: 12px;
    cursor: pointer;
}

.order-book-control.active {
    background: rgba(240, 185, 11, 0.1);
    color: #f0b90b;
}

.order-book-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.order-book-asks, .order-book-bids {
    flex: 1;
    overflow-y: auto;
    scrollbar-width: thin;
}

.order-book-asks::-webkit-scrollbar, .order-book-bids::-webkit-scrollbar {
    width: 4px;
}

.order-book-asks::-webkit-scrollbar-thumb, .order-book-bids::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
}

.order-book-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    padding: 4px 15px;
    font-size: 12px;
    position: relative;
}

.order-book-row:hover {
    background: rgba(255, 255, 255, 0.03);
}

.order-book-asks .order-book-row {
    color: #f6465d;
}

.order-book-bids .order-book-row {
    color: #0ecb81;
}

.order-book-depth {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 0;
    z-index: 1;
    opacity: 0.1;
}

.ask-depth {
    background: #f6465d;
}

.bid-depth {
    background: #0ecb81;
}

.order-book-price, .order-book-amount, .order-book-total {
    position: relative;
    z-index: 2;
}

.order-book-spread {
    padding: 6px 15px;
    background: rgba(0, 0, 0, 0.2);
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #848e9c;
}

/* Market Data Section */
.market-data {
    height: 500px;
    overflow-y: auto;
    position: relative;
    background: #12151c;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    scrollbar-width: thin;
}

.market-data::-webkit-scrollbar {
    width: 4px;
}

.market-data::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
}

.market-item {
    display: grid;
    grid-template-columns: 0.6fr 0.8fr 1fr 1fr 0.8fr;
    gap: 15px;
    padding: 8px 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.03);
    transition: all 0.2s;
    font-size: 13px;
    line-height: 1.5;
    position: relative;
}

.exchange-name {
    display: flex;
    align-items: center;
    gap: 5px;
}

.exchange-icon {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    object-fit: contain;
}

.market-item:hover {
    background: rgba(255, 255, 255, 0.03);
}

.market-header {
    background: #0d1017;
    font-weight: 500;
    color: #848e9c;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
    position: sticky;
    top: 0;
    z-index: 10;
}

.price-up {
    color: #0ecb81;
}

.price-down {
    color: #f6465d;
}

/* Enhanced Price Display */
.price-value {
    font-family: 'Roboto Mono', monospace;
    font-size: 13px;
    position: relative;
    font-weight: 500;
}

/* Advanced Pair Selector */
.pair-selector {
    display: flex;
    gap: 1px;
    margin: 0 0 15px 0;
    background: #12151c;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.pair-button {
    padding: 10px 15px;
    border: none;
    background: transparent;
    color: #848e9c;
    font-weight: 500;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    flex: 1;
    text-align: center;
}

.pair-button:hover {
    color: #eaecef;
    background: rgba(255, 255, 255, 0.02);
}

.pair-button.active {
    color: #f0b90b;
    background: rgba(240, 185, 11, 0.1);
}

.pair-button.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #f0b90b;
}

/* Trading Form */
.trading-form {
    background: #12151c;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.05);
    overflow: hidden;
}

.trading-form-tabs {
    display: flex;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.trading-form-tab {
    padding: 12px 15px;
    font-size: 14px;
    font-weight: 500;
    color: #848e9c;
    cursor: pointer;
    position: relative;
    flex: 1;
    text-align: center;
}

.trading-form-tab.active {
    color: #f0b90b;
}

.trading-form-tab.active::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: #f0b90b;
}

.trading-form-content {
    padding: 15px;
}

.trading-form-row {
    margin-bottom: 15px;
}

.trading-form-label {
    display: block;
    font-size: 12px;
    color: #848e9c;
    margin-bottom: 5px;
}

.trading-form-input {
    width: 100%;
    padding: 10px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
    border-radius: 4px;
    color: #eaecef;
    font-size: 14px;
}

.trading-form-input:focus {
    outline: none;
    border-color: rgba(240, 185, 11, 0.3);
}

.trading-form-slider {
    display: flex;
    gap: 5px;
    margin: 10px 0;
}

.slider-option {
    flex: 1;
    text-align: center;
    padding: 5px;
    background: rgba(255, 255, 255, 0.02);
    border-radius: 2px;
    font-size: 12px;
    color: #848e9c;
    cursor: pointer;
}

.slider-option:hover {
    background: rgba(255, 255, 255, 0.05);
    color: #eaecef;
}

.buy-button, .sell-button {
    width: 100%;
    padding: 12px;
    border: none;
    border-radius: 4px;
    font-weight: 500;
    font-size: 14px;
    cursor: pointer;
    margin-top: 10px;
    transition: all 0.2s ease;
}

.buy-button {
    background: #0ecb81;
    color: #fff;
}

.buy-button:hover {
    background: #0bb974;
}

.sell-button {
    background: #f6465d;
    color: #fff;
}

.sell-button:hover {
    background: #e03e54;
}

/* Advanced Animations */
@keyframes shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
}

@keyframes pulse-glow {
    0% { box-shadow: 0 0 5px rgba(255, 51, 102, 0.2); }
    50% { box-shadow: 0 0 20px rgba(255, 51, 102, 0.4); }
    100% { box-shadow: 0 0 5px rgba(255, 51, 102, 0.2); }
}

/* Volume Indicator */
.volume-bar {
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 2px;
    margin-top: 5px;
    position: relative;
    overflow: hidden;
}

.volume-fill {
    height: 100%;
    background: linear-gradient(90deg, #ff3366, #ff0033);
    transform-origin: left;
    transition: transform 0.3s ease;
}

/* Time Display */
.trade-time {
    font-family: 'Monaco', monospace;
    color: rgba(255, 255, 255, 0.6);
    font-size: 12px;
    background: rgba(255, 255, 255, 0.05);
    padding: 4px 8px;
    border-radius: 4px;
}

/* Scrollbar Styling */
.market-data::-webkit-scrollbar {
    width: 8px;
}

.market-data::-webkit-scrollbar-track {
    background: rgba(255, 0, 0, 0.05);
}

.market-data::-webkit-scrollbar-thumb {
    background: rgba(255, 0, 0, 0.2);
    border-radius: 4px;
}

.market-data::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 0, 0, 0.4);
}

/* Loading Animation */
.loading {
    color: #ff3333;
    text-align: center;
    padding: 20px;
    font-weight: 500;
    text-shadow: 0 0 10px rgba(255, 0, 0, 0.3);
    animation: pulse 1.5s infinite;
}

@keyframes pulse {
    0% { opacity: 0.5; }
    50% { opacity: 1; }
    100% { opacity: 0.5; }
}

/* Exchange Selector */
.exchange-selector {
    background: #12151c;
    border-radius: 16px;
    padding: 15px;
    margin-bottom: 15px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    position: relative;
    overflow: hidden;
}

/* Compact version for smaller display */
.exchange-selector.compact {
    padding: 10px;
    margin-bottom: 10px;
}

.exchange-title {
    font-size: 14px;
    font-weight: 600;
    color: #848e9c;
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
}

.auto-switch-indicator {
    font-size: 10px;
    background: rgba(14, 203, 129, 0.2);
    color: #0ecb81;
    padding: 2px 6px;
    border-radius: 10px;
    font-weight: 500;
    letter-spacing: 0.5px;
    position: relative;
}

.auto-switch-indicator::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    background-color: #0ecb81;
    border-radius: 50%;
    margin-right: 4px;
    animation: pulse 1.5s infinite;
    vertical-align: middle;
}

.exchange-selector.compact .exchange-title {
    margin-bottom: 8px;
    font-size: 12px;
}

.exchange-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
}

.exchange-selector.compact .exchange-cards {
    grid-template-columns: repeat(6, 1fr);
    gap: 8px;
    margin-bottom: 8px;
}

.exchange-card {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(5px);
}

.exchange-selector.compact .exchange-card {
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.exchange-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, rgba(255, 255, 255, 0.05), transparent);
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 1;
}

.exchange-card:hover::before {
    opacity: 1;
}

.exchange-card.active {
    background: rgba(240, 185, 11, 0.1);
    border-color: rgba(240, 185, 11, 0.3);
    box-shadow: 0 0 20px rgba(240, 185, 11, 0.2);
    transform: translateY(-5px);
}

.exchange-selector.compact .exchange-card.active {
    background: rgba(240, 185, 11, 0.2);
    border-color: rgba(240, 185, 11, 0.5);
    box-shadow: 0 0 10px rgba(240, 185, 11, 0.3);
    transform: translateY(-2px);
}

.exchange-card.active::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: #f0b90b;
}

.exchange-selector.compact .exchange-card.active::after {
    width: 100%;
    height: 3px;
    top: auto;
    bottom: 0;
}

.exchange-card-header {
    padding: 15px;
    display: flex;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    z-index: 2;
}

.exchange-selector.compact .exchange-card-header {
    padding: 8px;
    justify-content: center;
    border-bottom: none;
}

.exchange-badge {
    position: absolute;
    top: 10px;
    right: 10px;
    background: linear-gradient(45deg, #f0b90b, #f8d33a);
    color: #000;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 10px;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
    animation: badgePulse 2s infinite;
}

.exchange-badge.blue {
    background: linear-gradient(45deg, #1da1f2, #4dabf5);
    color: white;
}

.exchange-badge.green {
    background: linear-gradient(45deg, #0ecb81, #2edf9e);
    color: white;
}

@keyframes badgePulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}

.exchange-logo {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.1);
    padding: 3px;
}

.exchange-selector.compact .exchange-logo {
    width: 24px;
    height: 24px;
    padding: 2px;
}

.exchange-name {
    font-size: 16px;
    font-weight: 600;
    color: #eaecef;
}


.exchange-card.active .exchange-name {
    color: #f0b90b;
}

.exchange-card-body {
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    flex-grow: 1;
    position: relative;
    z-index: 2;
}

.exchange-selector.compact .exchange-card-body,
.exchange-selector.compact .exchange-card-footer,
.exchange-selector.compact .exchange-badge,
.exchange-selector.compact .current-exchange-indicator {
    display: none;
}

.exchange-price {
    font-size: 12px;
    color: #848e9c;
    margin-top: 5px;
    padding-top: 8px;
    border-top: 1px dashed rgba(255, 255, 255, 0.05);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.exchange-price .price-value {
    font-weight: 600;
    color: #eaecef;
    font-family: 'Roboto Mono', monospace;
}

.exchange-card.active .exchange-price .price-value {
    color: #f0b90b;
    animation: pricePulse 2s infinite;
}

@keyframes pricePulse {
    0% { opacity: 0.8; }
    50% { opacity: 1; }
    100% { opacity: 0.8; }
}

.price-change {
    animation: priceChange 0.5s ease-out;
}

@keyframes priceChange {
    0% { transform: scale(1); color: inherit; }
    50% { transform: scale(1.2); color: #f0b90b; }
    100% { transform: scale(1); color: inherit; }
}

.exchange-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 5px;
}

.stat-label {
    font-size: 12px;
    color: #848e9c;
}

.stat-value {
    font-size: 14px;
    font-weight: 600;
    color: #eaecef;
}

.exchange-card.active .stat-value {
    color: #f0b90b;
}

.exchange-card-footer {
    padding: 10px 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    position: relative;
    z-index: 2;
}

.exchange-status {
    font-size: 12px;
    color: #848e9c;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
}

.exchange-status::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #848e9c;
    display: inline-block;
}

.exchange-status.active {
    color: #0ecb81;
}

.exchange-status.active::before {
    background: #0ecb81;
    box-shadow: 0 0 10px rgba(14, 203, 129, 0.5);
    animation: pulse 1.5s infinite;
}

.current-exchange-indicator {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: rgba(0, 0, 0, 0.3);
    padding: 10px 15px;
    border-radius: 30px;
    margin-top: 10px;
    border: 1px solid rgba(255, 255, 255, 0.05);
}

.current-exchange-indicator .indicator-dot {
    width: 8px;
    height: 8px;
    background: #0ecb81;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
}

#current-exchange-name {
    color: #f0b90b;
    font-weight: 600;
}

/* Trading Dashboard */
.trading-dashboard {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 15px;
    margin-bottom: 20px;
}

/* Stats Cards */
.stat-card {
    background: #12151c;
    padding: 15px;
    border-radius: 16px;
    border: none;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.stat-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.stat-card-title {
    font-size: 12px;
    color: #848e9c;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
}

.stat-card-icon {
    width: 16px;
    height: 16px;
    opacity: 0.7;
}

.stat-card-value {
    font-size: 20px;
    font-weight: 600;
    margin-bottom: 5px;
    font-family: 'Roboto Mono', monospace;
}

.stat-card-change {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 4px;
}

.change-positive {
    color: #0ecb81;
}

.change-negative {
    color: #f6465d;
}

.stat-card-chart {
    height: 40px;
    margin-top: 10px;
    position: relative;
}

.chart-line {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}

.chart-line-positive {
    background: linear-gradient(to top, rgba(14, 203, 129, 0.1) 0%, transparent 100%);
}

.chart-line-negative {
    background: linear-gradient(to top, rgba(246, 70, 93, 0.1) 0%, transparent 100%);
}

.chart-line::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 2px;
}

.chart-line-positive::after {
    background: #0ecb81;
}

.chart-line-negative::after {
    background: #f6465d;
}

/* Market Trend Visualization */
.market-trend-visualization {
    position: relative;
    height: 300px;
    background: #0a0e17;
    border-radius: 16px;
    border: none;
    margin-bottom: 20px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.trend-background {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
        linear-gradient(rgba(255, 0, 0, 0.05), rgba(255, 0, 0, 0.1)),
        radial-gradient(circle at 30% 30%, rgba(255, 0, 0, 0.2), transparent 70%),
        radial-gradient(circle at 70% 70%, rgba(255, 0, 0, 0.2), transparent 70%);
    opacity: 0.8;
    z-index: 1;
    animation: backgroundPulse 8s infinite alternate;
}

@keyframes backgroundPulse {
    0% { opacity: 0.6; filter: hue-rotate(0deg); }
    50% { opacity: 0.8; filter: hue-rotate(30deg); }
    100% { opacity: 0.6; filter: hue-rotate(0deg); }
}

.trend-grid {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image:
        linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 20px 20px;
    z-index: 2;
}

.trend-indicators {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    gap: 15px;
    z-index: 5;
}

.trend-indicator {
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    background: rgba(0, 0, 0, 0.5);
    padding: 5px 10px;
    border-radius: 3px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.trend-indicator.blink {
    background: rgba(246, 70, 93, 0.7);
    animation: blinkIndicator 1s infinite alternate;
}

.coin-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
}

.coin-icon {
    width: 16px;
    height: 16px;
    background-color: #f0b90b;
    border-radius: 50%;
    position: relative;
}

.coin-icon::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 10px;
    height: 10px;
    background-color: #0c0e12;
    border-radius: 50%;
}

.trend-flash {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(14, 203, 129, 0.1);
    opacity: 0;
    z-index: 4;
}

.trend-volume-bars {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 50px;
    z-index: 3;
    display: flex;
    align-items: flex-end;
}

.volume-bar {
    flex: 1;
    background: rgba(14, 203, 129, 0.2);
    margin: 0 1px;
    transform-origin: bottom;
    transition: height 0.3s ease;
}

.volume-bar.red {
    background: rgba(246, 70, 93, 0.2);
}

.trend-price-markers {
    position: absolute;
    top: 0;
    bottom: 0;
    right: 10px;
    width: 60px;
    z-index: 3;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 20px 0;
    pointer-events: none;
}

.price-marker {
    font-family: 'Roboto Mono', monospace;
    font-size: 12px;
    color: rgba(255, 255, 255, 0.7);
    background: rgba(0, 0, 0, 0.3);
    padding: 2px 5px;
    border-radius: 2px;
}

.trend-particles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    overflow: hidden;
}

.particle {
    position: absolute;
    width: 3px;
    height: 3px;
    background: rgba(255, 255, 255, 0.5);
    border-radius: 50%;
    animation: particleFloat 3s infinite linear;
}

@keyframes particleFloat {
    0% { transform: translateY(0) rotate(0deg); opacity: 0; }
    20% { opacity: 1; }
    80% { opacity: 1; }
    100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
}

.trend-candles {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
}

.candle {
    position: absolute;
    width: 4px;
    background: #0ecb81;
    bottom: 0;
    opacity: 0.5;
}

.candle.red {
    background: #f6465d;
}

@keyframes blinkIndicator {
    from { opacity: 0.7; }
    to { opacity: 1; }
}

.trend-numbers {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 2;
    overflow: hidden;
}

.trend-number {
    position: absolute;
    font-family: 'Roboto Mono', monospace;
    font-size: 14px;
    opacity: 0.4;
    z-index: 2;
    animation: fadeInOut 5s infinite;
}

.trend-number-green {
    color: #0ecb81;
}

.trend-number-red {
    color: #f6465d;
}

.trend-line {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3;
}

.trend-svg {
    width: 100%;
    height: 100%;
}

.trend-path {
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    animation: drawLine 3s forwards, glowLine 2s infinite alternate;
}

.trend-arrow {
    position: absolute;
    bottom: 10px;
    right: 10px;
    width: 40px;
    height: 40px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>');
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.8;
    z-index: 4;
    animation: arrowPulse 2s infinite;
}

.trend-big-arrow {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    height: 150px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z"/></svg>');
    background-size: contain;
    background-repeat: no-repeat;
    opacity: 0.1;
    z-index: 2;
    animation: bigArrowPulse 3s infinite;
}

.trend-overlay {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 5;
}

.trend-profit {
    font-family: 'Roboto Mono', monospace;
    font-size: 24px;
    font-weight: 700;
    color: #0ecb81;
    text-shadow: 0 0 10px rgba(14, 203, 129, 0.5);
    animation: profitPulse 2s infinite;
}

@keyframes bigArrowPulse {
    0% { opacity: 0.1; transform: translate(-50%, -50%) scale(1); }
    50% { opacity: 0.2; transform: translate(-50%, -50%) scale(1.1); }
    100% { opacity: 0.1; transform: translate(-50%, -50%) scale(1); }
}

@keyframes profitPulse {
    0% { opacity: 0.8; text-shadow: 0 0 10px rgba(14, 203, 129, 0.5); }
    50% { opacity: 1; text-shadow: 0 0 20px rgba(14, 203, 129, 0.8); }
    100% { opacity: 0.8; text-shadow: 0 0 10px rgba(14, 203, 129, 0.5); }
}

@keyframes fadeInOut {
    0% { opacity: 0; }
    50% { opacity: 0.4; }
    100% { opacity: 0; }
}

@keyframes drawLine {
    0% { stroke-dashoffset: 1000; }
    100% { stroke-dashoffset: 0; }
}

@keyframes glowLine {
    0% { filter: drop-shadow(0 0 2px rgba(14, 203, 129, 0.5)); }
    100% { filter: drop-shadow(0 0 8px rgba(14, 203, 129, 0.8)); }
}

@keyframes arrowPulse {
    0% { transform: translateY(0); opacity: 0.8; }
    50% { transform: translateY(-10px); opacity: 1; }
    100% { transform: translateY(0); opacity: 0.8; }
}

/* Trading Activation Container */
.trading-activation-container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #12151c;
    border-radius: 16px;
    border: none;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

.activation-status {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.status-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
}

.status-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #0ecb81;
    position: relative;
    box-shadow: 0 0 10px rgba(14, 203, 129, 0.8);
}

.status-dot::before {
    content: '';
    position: absolute;
    top: -6px;
    left: -6px;
    right: -6px;
    bottom: -6px;
    border-radius: 50%;
    background: rgba(14, 203, 129, 0.2);
    animation: pulse 1.5s infinite;
}

.status-dot::after {
    content: '';
    position: absolute;
    top: -12px;
    left: -12px;
    right: -12px;
    bottom: -12px;
    border-radius: 50%;
    background: rgba(14, 203, 129, 0.1);
    animation: pulse 2s infinite 0.5s;
}

.status-text {
    font-size: 14px;
    font-weight: 500;
}

.status-active {
    color: #0ecb81;
}

.status-inactive {
    color: #848e9c;
}

.status-inactive .status-dot {
    background: #848e9c;
    box-shadow: 0 0 10px rgba(132, 142, 156, 0.5);
}

.status-inactive .status-dot::before {
    background: rgba(132, 142, 156, 0.2);
    animation: none;
}

.status-inactive .status-dot::after {
    background: rgba(132, 142, 156, 0.1);
    animation: none;
}

.status-time {
    font-size: 12px;
    color: #848e9c;
    display: flex;
    align-items: center;
    gap: 5px;
}

.status-time-value {
    font-family: 'Roboto Mono', monospace;
    background: rgba(255, 255, 255, 0.03);
    padding: 2px 6px;
    border-radius: 3px;
}

/* Trading Activation Button */
.trading-activation-button {
    position: relative;
    padding: 15px 30px;
    background: linear-gradient(45deg, #f6465d, #ff0033);
    border: none;
    border-radius: 30px;
    color: #fff;
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    overflow: hidden;
    transition: all 0.3s ease;
    box-shadow: 0 8px 25px rgba(246, 70, 93, 0.5), 0 0 15px rgba(246, 70, 93, 0.3) inset;
    min-width: 220px;
    height: 60px;
    text-transform: uppercase;
    letter-spacing: 1px;
    z-index: 10;
    backdrop-filter: blur(5px);
}

.trading-activation-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 0 30px rgba(246, 70, 93, 0.7);
}

.button-glow {
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%);
    animation: rotateGlow 3s linear infinite;
    z-index: 1;
}

.button-pulse {
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    border-radius: 30px;
    background: rgba(246, 70, 93, 0.5);
    opacity: 0;
    z-index: -1;
    animation: buttonPulse 2s infinite;
}

.trading-activation-button::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(45deg, #f6465d, #ff0033, #f6465d);
    border-radius: 32px;
    z-index: -2;
    animation: borderGlow 3s linear infinite;
    opacity: 0.7;
}

.trading-activation-button.active::before {
    background: linear-gradient(45deg, #0ecb81, #0bb974, #0ecb81);
}

@keyframes borderGlow {
    0% { opacity: 0.3; }
    50% { opacity: 0.7; }
    100% { opacity: 0.3; }
}

.button-content {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    z-index: 2;
}

.button-icon {
    width: 24px;
    height: 24px;
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4V7zm-1-5C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>');
    background-size: contain;
    background-repeat: no-repeat;
    transition: transform 0.3s ease;
}

.trading-activation-button:hover .button-icon {
    transform: rotate(90deg);
}

.trading-activation-button.active {
    background: linear-gradient(45deg, #0ecb81, #0bb974);
    box-shadow: 0 0 20px rgba(14, 203, 129, 0.5);
}

.trading-activation-button.active .button-pulse {
    background: rgba(14, 203, 129, 0.5);
}

.trading-activation-button.active .button-icon {
    background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>');
    transform: scale(1.2);
}

/* Profit Stats */
.profit-stats {
    display: flex;
    gap: 15px;
    margin-top: 15px;
}

.profit-stat {
    background: rgba(0, 0, 0, 0.3);
    padding: 12px 15px;
    border-radius: 16px;
    border: none;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease;
}

.profit-stat:active {
    transform: scale(0.98);
}

.profit-label {
    font-size: 12px;
    color: #848e9c;
    margin-bottom: 5px;
}

.profit-value {
    font-family: 'Roboto Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    color: #0ecb81;
}

/* Floating Profits */
.floating-profits-container {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 9999;
    overflow: hidden;
}

.floating-profit, .floating-loss {
    position: absolute;
    font-family: 'Roboto Mono', monospace;
    font-size: 16px;
    font-weight: 600;
    background: rgba(0, 0, 0, 0.8);
    padding: 8px 15px;
    border-radius: 30px;
    animation: floatUp 6s forwards cubic-bezier(0.25, 0.1, 0.25, 1);
    opacity: 0;
    z-index: 1000;
    backdrop-filter: blur(4px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform: scale(0.8);
}

.floating-profit {
    color: #0ecb81;
    box-shadow: 0 0 15px rgba(14, 203, 129, 0.6);
    text-shadow: 0 0 10px rgba(14, 203, 129, 0.8);
}

.floating-loss {
    color: #f6465d;
    box-shadow: 0 0 15px rgba(246, 70, 93, 0.6);
    text-shadow: 0 0 10px rgba(246, 70, 93, 0.8);
}

.floating-profit::before, .floating-loss::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 30px;
    z-index: -1;
    opacity: 0.3;
    animation: pulseBorder 2s infinite;
}

.floating-profit::before {
    border: 1px solid rgba(14, 203, 129, 0.8);
}

.floating-loss::before {
    border: 1px solid rgba(246, 70, 93, 0.8);
}

@keyframes pulseBorder {
    0% { transform: scale(1); opacity: 0.3; }
    50% { transform: scale(1.1); opacity: 0.5; }
    100% { transform: scale(1); opacity: 0.3; }
}

@keyframes floatUp {
    0% { transform: translateY(0) scale(0.8); opacity: 0; }
    15% { transform: translateY(-20px) scale(1); opacity: 1; }
    85% { transform: translateY(-80vh) scale(1); opacity: 1; }
    100% { transform: translateY(-100vh) scale(0.8); opacity: 0; }
}

.fade-out {
    animation: fadeOut 0.5s forwards !important;
}

@keyframes fadeOut {
    from { opacity: 1; }
    to { opacity: 0; transform: scale(0.8); }
}

@keyframes buttonPulse {
    0% { opacity: 0; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(1.05); }
    100% { opacity: 0; transform: scale(1); }
}

@keyframes rotateGlow {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Price Jumper Animation */
.price-jumper {
    position: relative;
    padding: 15px;
    background: rgba(0,0,0,0.4);
    border-radius: 10px;
    margin: 20px 0;
}

.price-pulse {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 10px;
    animation: pricePulse 2s infinite;
}

/* Growth Indicator */
.growth-indicator {
    position: relative;
    height: 150px;
    background: rgba(0,0,0,0.3);
    border-radius: 12px;
    overflow: hidden;
    margin: 20px 0;
}

.growth-bar {
    position: absolute;
    bottom: 0;
    width: 100%;
    background: linear-gradient(0deg, rgba(0,255,102,0.3), transparent);
    animation: growthPulse 3s infinite;
}

/* Live Trading Indicators */
.live-indicators {
    display: flex;
    gap: 10px;
    margin: 15px 0;
}

.indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #ff3366;
    animation: indicatorPulse 1.5s infinite;
}

/* Market Trend Arrows */
.trend-arrows {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
}

.trend-arrow {
    font-size: 24px;
    animation: arrowFloat 2s infinite;
}

/* Advanced Animations */
@keyframes rotateGradient {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

@keyframes pricePulse {
    0% { box-shadow: 0 0 0 0 rgba(255,51,102,0.4); }
    70% { box-shadow: 0 0 0 20px rgba(255,51,102,0); }
    100% { box-shadow: 0 0 0 0 rgba(255,51,102,0); }
}

@keyframes growthPulse {
    0% { height: 30%; opacity: 0.5; }
    50% { height: 70%; opacity: 0.8; }
    100% { height: 30%; opacity: 0.5; }
}

@keyframes indicatorPulse {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
}

@keyframes arrowFloat {
    0% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0); }
}

/* Trading Activity Sparkles */
.sparkle {
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: #fff;
    animation: sparkle 1.5s infinite;
}

@keyframes sparkle {
    0% { transform: scale(0) rotate(0deg); opacity: 0; }
    50% { transform: scale(1) rotate(180deg); opacity: 1; }
    100% { transform: scale(0) rotate(360deg); opacity: 0; }
}

/* Real-time Chart Container */
.chart-container {
    position: relative;
    height: 300px;
    background: rgba(0,0,0,0.3);
    border-radius: 12px;
    margin: 20px 0;
    overflow: hidden;
}

.chart-grid {
    position: absolute;
    width: 100%;
    height: 100%;
    background-image:
        linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
    background-size: 20px 20px;
    animation: gridMove 20s linear infinite;
}

@keyframes gridMove {
    0% { transform: translateX(0); }
    100% { transform: translateX(-20px); }
}

/* Trading Volume Waves */
.volume-waves {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 40px;
    background: linear-gradient(transparent, rgba(255,51,102,0.2));
    animation: waveMotion 3s ease-in-out infinite;
}

@keyframes waveMotion {
    0% { transform: translateY(0) scaleY(1); }
    50% { transform: translateY(-10px) scaleY(1.2); }
    100% { transform: translateY(0) scaleY(1); }
}

/* Price Update Animation */
.price-updated {
    animation: priceUpdate 1s ease-out;
}

@keyframes priceUpdate {
    0% { background-color: rgba(255, 255, 255, 0.3); }
    100% { background-color: rgba(0, 0, 0, 0.3); }
}

/* Price Flash Effects */
.price-flash {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 4px;
    opacity: 0.7;
    pointer-events: none;
    animation: flashFade 1s ease-out forwards;
}

.flash-green {
    background-color: rgba(0, 255, 102, 0.3);
}

.flash-red {
    background-color: rgba(255, 51, 102, 0.3);
}

@keyframes flashFade {
    0% { opacity: 0.7; }
    100% { opacity: 0; }
}
</style>


<!-- Market Trend Visualization -->
<div class="market-trend-visualization">
    <div class="trend-background"></div>
    <div class="trend-grid"></div>
    <div class="trend-numbers"></div>
    <div class="trend-particles"></div>
    <div class="trend-line">
        <svg viewBox="0 0 1000 300" preserveAspectRatio="none" class="trend-svg">
            <path d="M0,150 L100,140 L200,160 L300,130 L400,150 L500,100 L600,120 L700,80 L800,60 L900,30 L1000,10" class="trend-path" stroke="#0ecb81" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
    </div>
    <div class="trend-arrow"></div>
    <div class="trend-big-arrow"></div>
    <div class="trend-overlay">
        <div class="trend-profit">+458.72 USDT</div>
    </div>
    <div class="trend-indicators">
        <div class="trend-indicator coin-indicator">
            <div class="coin-icon"></div>
            <span class="coin-pair">BTC/USDT</span>
        </div>
        <div class="trend-indicator">+12.45%</div>
        <div class="trend-indicator blink">LIVE</div>
    </div>
    <div class="trend-candles"></div>
    <div class="trend-flash"></div>
    <div class="trend-volume-bars"></div>
    <div class="trend-price-markers"></div>
</div>

<!-- Trading Activation Button -->
<div class="trading-activation-container">
    <div class="activation-status">
        <div class="status-indicator">
            <div class="status-dot"></div>
            <div class="status-text status-inactive">Trading Inactive</div>
        </div>
        <div class="status-time">
            <span>Session time:</span>
            <span class="status-time-value">00:00:00</span>
        </div>
        <div class="profit-stats">
            <div class="profit-stat">
                <div class="profit-label">Total Profit</div>
                <div class="profit-value">+0.00 USDT</div>
            </div>
            <div class="profit-stat">
                <div class="profit-label">Active Trades</div>
                <div class="profit-value">0</div>
            </div>
        </div>
    </div>
    <button class="trading-activation-button">
        <div class="button-glow"></div>
        <div class="button-pulse"></div>
        <div class="button-content">
            <div class="button-icon"></div>
            <span>ACTIVATE TRADING</span>
        </div>
    </button>
</div>
<!-- Exchange Selector - Compact Version -->
<div class="exchange-selector compact">
    <div class="exchange-title">Trading Exchanges <span class="auto-switch-indicator">Auto-switching</span></div>
    <div class="exchange-cards">
        <div class="exchange-card active" data-exchange="binance">
            <div class="exchange-card-header">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4=" class="exchange-logo" alt="Binance">
                <span class="exchange-name">Binance</span>
                <div class="exchange-badge">Popular</div>
            </div>
            <div class="exchange-card-body">
                <div class="exchange-stat">
                    <span class="stat-label">Volume</span>
                    <span class="stat-value">$12.4B</span>
                </div>
                <div class="exchange-stat">
                    <span class="stat-label">Pairs</span>
                    <span class="stat-value">740+</span>
                </div>
                <div class="exchange-price">BTC: <span class="price-value">$45,123.45</span></div>
            </div>
            <div class="exchange-card-footer">
                <div class="exchange-status active">Connected</div>
            </div>
        </div>
        <div class="exchange-card" data-exchange="kucoin">
            <div class="exchange-card-header">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+" class="exchange-logo" alt="KuCoin">
                <span class="exchange-name">KuCoin</span>
            </div>
            <div class="exchange-card-body">
                <div class="exchange-stat">
                    <span class="stat-label">Volume</span>
                    <span class="stat-value">$5.8B</span>
                </div>
                <div class="exchange-stat">
                    <span class="stat-label">Pairs</span>
                    <span class="stat-value">580+</span>
                </div>
                <div class="exchange-price">BTC: <span class="price-value">$45,098.32</span></div>
            </div>
            <div class="exchange-card-footer">
                <div class="exchange-status">Ready</div>
            </div>
        </div>
        <div class="exchange-card" data-exchange="coinbase">
            <div class="exchange-card-header">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwNTJGRiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI4QzkuMzY4IDQgNCAxMC4zNjggNCAxN3M1LjM2OCAxMiAxMiAxMiAxMi01LjM2OCAxMi0xMlMyMi42MzIgNCAxNiA0em0zLjU4MiAxNS45NTNjLS4xNTUuMzYtLjQyLjY1NC0uNzg0Ljg3NC0uMzYzLjIyLS44MjUuMzMtMS4zNjMuMzMtLjYxIDAtMS4xNS0uMTYtMS42Mi0uNDgzLS40Ny0uMzIyLS43OTgtLjc5My0uOTg0LTEuNDFsMS44NS0uNzY1Yy4wOTQuMjY3LjIyNy40NjYuMzk4LjU5OC4xNy4xMzIuMzY4LjE5OC41OTIuMTk4LjIyIDAgLjQwNi0uMDQ3LjU1OC0uMTQyLjE1Mi0uMDk0LjIyOC0uMjI3LjIyOC0uNHYtNi4xMzhoMi4xMjV2Ni4zMzh6bS0xLjg4Mi04LjQ2N2MtLjUxNi0uNDctMS4xMy0uNzA0LTEuODQtLjcwNC0uNzEgMC0xLjMyNC4yMzQtMS44NC43MDQtLjUxNi40Ny0uNzc1IDEuMDQzLS43NzUgMS43MnMuMjU4IDEuMjUyLjc3NSAxLjcyYy41MTYuNDcgMS4xMy43MDQgMS44NC43MDQuNzEgMCAxLjMyNC0uMjM0IDEuODQtLjcwNC41MTYtLjQ3Ljc3NS0xLjA0My43NzUtMS43MnMtLjI1OC0xLjI1Mi0uNzc1LTEuNzJ6TTEwLjk1MyAxOC42M2MtLjYxIDAtMS4xNS0uMTYtMS42Mi0uNDgzLS40Ny0uMzIyLS43OTgtLjc5My0uOTg0LTEuNDFsMS44NS0uNzY1Yy4wOTQuMjY3LjIyNy40NjYuMzk4LjU5OC4xNy4xMzIuMzY4LjE5OC41OTIuMTk4LjIyIDAgLjQwNi0uMDQ3LjU1OC0uMTQyLjE1Mi0uMDk0LjIyOC0uMjI3LjIyOC0uNHYtNi4xMzhoMi4xMjV2Ni4zMzhjLS4xNTUuMzYtLjQyLjY1NC0uNzg0Ljg3NC0uMzYzLjIyLS44MjUuMzMtMS4zNjMuMzN6TTkuMjM0IDkuODg3Yy41MTYuNDcgMS4xMy43MDQgMS44NC43MDQuNzEgMCAxLjMyNC0uMjM0IDEuODQtLjcwNC41MTYtLjQ3Ljc3NS0xLjA0My43NzUtMS43MnMtLjI1OC0xLjI1Mi0uNzc1LTEuNzJjLS41MTYtLjQ3LTEuMTMtLjcwNC0xLjg0LS43MDQtLjcxIDAtMS4zMjQuMjM0LTEuODQuNzA0LS41MTYuNDctLjc3NSAxLjA0My0uNzc1IDEuNzJzLjI1OCAxLjI1Mi43NzUgMS43MnoiLz48L3N2Zz4=" class="exchange-logo" alt="Coinbase">
                <span class="exchange-name">Coinbase</span>
                <div class="exchange-badge blue">US</div>
            </div>
            <div class="exchange-card-body">
                <div class="exchange-stat">
                    <span class="stat-label">Volume</span>
                    <span class="stat-value">$8.2B</span>
                </div>
                <div class="exchange-stat">
                    <span class="stat-label">Pairs</span>
                    <span class="stat-value">420+</span>
                </div>
                <div class="exchange-price">BTC: <span class="price-value">$45,156.78</span></div>
            </div>
            <div class="exchange-card-footer">
                <div class="exchange-status">Ready</div>
            </div>
        </div>
        <div class="exchange-card" data-exchange="crypto">
            <div class="exchange-card-header">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4=" class="exchange-logo" alt="Crypto.com">
                <span class="exchange-name">Crypto.com</span>
            </div>
            <div class="exchange-card-body">
                <div class="exchange-stat">
                    <span class="stat-label">Volume</span>
                    <span class="stat-value">$3.7B</span>
                </div>
                <div class="exchange-stat">
                    <span class="stat-label">Pairs</span>
                    <span class="stat-value">250+</span>
                </div>
                <div class="exchange-price">BTC: <span class="price-value">$45,087.65</span></div>
            </div>
            <div class="exchange-card-footer">
                <div class="exchange-status">Ready</div>
            </div>
        </div>
        <div class="exchange-card" data-exchange="okx">
            <div class="exchange-card-header">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIxNmZlYSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNy4xMDUtMTAuMDI1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXptLTkuNDk1LTkuNDk1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXoiLz48L3N2Zz4=" class="exchange-logo" alt="OKX">
                <span class="exchange-name">OKX</span>
                <div class="exchange-badge green">New</div>
            </div>
            <div class="exchange-card-body">
                <div class="exchange-stat">
                    <span class="stat-label">Volume</span>
                    <span class="stat-value">$4.9B</span>
                </div>
                <div class="exchange-stat">
                    <span class="stat-label">Pairs</span>
                    <span class="stat-value">350+</span>
                </div>
                <div class="exchange-price">BTC: <span class="price-value">$45,112.89</span></div>
            </div>
            <div class="exchange-card-footer">
                <div class="exchange-status">Ready</div>
            </div>
        </div>
        <div class="exchange-card" data-exchange="gate">
            <div class="exchange-card-header">
                <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2Y0YjgwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNS40NjYtMTIuNzY2YzAgMy4yNTUgMi42NCA1Ljg5NiA1Ljg5NiA1Ljg5NnM1Ljg5Ni0yLjY0IDUuODk2LTUuODk2LTIuNjQtNS44OTYtNS44OTYtNS44OTYtNS44OTYgMi42NC01Ljg5NiA1Ljg5NnptNS44OTYtMy45M2MyLjE3IDAgMy45MyAxLjc2IDMuOTMgMy45M3MtMS43NiAzLjkzLTMuOTMgMy45My0zLjkzLTEuNzYtMy45My0zLjkzIDEuNzYtMy45MyAzLjkzLTMuOTN6bTAgMS45NjVjLTEuMDg1IDAtMS45NjUuODgtMS45NjUgMS45NjVzLjg4IDEuOTY1IDEuOTY1IDEuOTY1IDEuOTY1LS44OCAxLjk2NS0xLjk2NS0uODgtMS45NjUtMS45NjUtMS45NjV6Ii8+PC9zdmc+" class="exchange-logo" alt="Gate.io">
                <span class="exchange-name">Gate.io</span>
            </div>
            <div class="exchange-card-body">
                <div class="exchange-stat">
                    <span class="stat-label">Volume</span>
                    <span class="stat-value">$2.8B</span>
                </div>
                <div class="exchange-stat">
                    <span class="stat-label">Pairs</span>
                    <span class="stat-value">280+</span>
                </div>
                <div class="exchange-price">BTC: <span class="price-value">$45,076.21</span></div>
            </div>
            <div class="exchange-card-footer">
                <div class="exchange-status">Ready</div>
            </div>
        </div>
    </div>
    <div class="current-exchange-indicator">
        <div class="indicator-dot"></div>
        <span>Currently trading on <strong id="current-exchange-name">Binance</strong></span>
    </div>
</div>

<!-- Floating Profit Indicators -->
<div class="floating-profits-container"></div>

<div class="live-trading-container">
    <div class="live-trading-header">
        <div class="header-title">
            <h1>Live Trades</h1>
            <div class="trading-pair">
                <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.png" id="pair-icon" class="pair-icon" alt="BTC">
                <span class="pair-name current-pair-name">BTC/USDT</span>
            </div>
        </div>
        <div class="header-info">
            <span id="lastPrice">$45,123.45</span>
            <div class="price-change-indicator price-up-indicator">+2.5%</div>
        </div>
    </div>

    <!-- Add CSS for pair change animation -->
    <style>
        .pair-changed {
            animation: pairChangeFlash 0.5s ease;
        }

        @keyframes pairChangeFlash {
            0% { background-color: rgba(240, 185, 11, 0.1); }
            50% { background-color: rgba(240, 185, 11, 0.3); }
            100% { background-color: rgba(240, 185, 11, 0.1); }
        }

        .active-pair {
            background: linear-gradient(45deg, #f0b90b, #f8d33a) !important;
            box-shadow: 0 0 10px rgba(240, 185, 11, 0.5) !important;
        }
    </style>

    <div class="trading-layout">
        <!-- Order Book -->
        <div class="order-book">
            <div class="order-book-header">
                <div class="order-book-title">Order Book</div>
                <div class="order-book-controls">
                    <button class="order-book-control active">0.1</button>
                    <button class="order-book-control">0.01</button>
                    <button class="order-book-control">0.001</button>
                </div>
            </div>
            <div class="order-book-content">
                <div class="order-book-asks">
                    <!-- Asks will be populated by JS -->
                </div>
                <div class="order-book-spread">
                    <span>Spread</span>
                    <span>$12.45 (0.03%)</span>
                </div>
                <div class="order-book-bids">
                    <!-- Bids will be populated by JS -->
                </div>
            </div>
        </div>

        <!-- Market Data -->
        <div class="market-data" id="marketData">
            <div class="market-item market-header">
                <span class="trade-type">Type</span>
                <span class="price-value">Exchange</span>
                <span class="trade-amount">Amount</span>
                <span class="trade-time">Time</span>
            </div>
            <!-- Market data will be populated by JS -->
        </div>
    </div>

    <div class="pair-selector">
        <button class="pair-button active-pair" data-pair="BTCUSDT">BTC/USDT</button>
        <button class="pair-button" data-pair="ETHUSDT">ETH/USDT</button>
        <button class="pair-button" data-pair="BNBUSDT">BNB/USDT</button>
        <button class="pair-button" data-pair="SOLUSDT">SOL/USDT</button>
        <button class="pair-button" data-pair="ADAUSDT">ADA/USDT</button>
        <button class="pair-button" data-pair="DOGEUSDT">DOGE/USDT</button>
    </div>



    <div class="loading" id="loading">Loading market data...</div>
</div>

<script>
// Global variables for trading data
let currentBasePrice = 45000; // Initial value until API data is loaded
let currentTradingPair = 'BTCUSDT'; // Default trading pair

// List of trading pairs to cycle through
const tradingPairs = [
    { symbol: 'BTCUSDT', name: 'BTC/USDT', fullName: 'Bitcoin' },
    { symbol: 'BNBUSDT', name: 'BNB/USDT', fullName: 'Binance Coin' },
    { symbol: 'ETHUSDT', name: 'ETH/USDT', fullName: 'Ethereum' },
    { symbol: 'SOLUSDT', name: 'SOL/USDT', fullName: 'Solana' },
    { symbol: 'ADAUSDT', name: 'ADA/USDT', fullName: 'Cardano' },
    { symbol: 'DOGEUSDT', name: 'DOGE/USDT', fullName: 'Dogecoin' }
];

// Function to get current trading pair info
function getCurrentPairInfo() {
    return tradingPairs.find(pair => pair.symbol === currentTradingPair) || tradingPairs[0];
}

// Function to change trading pair
function changeTradingPair() {
    if (!tradingActive) return;

    // Find current pair index
    const currentIndex = tradingPairs.findIndex(pair => pair.symbol === currentTradingPair);
    // Get next pair (or loop back to first)
    const nextIndex = (currentIndex + 1) % tradingPairs.length;
    currentTradingPair = tradingPairs[nextIndex].symbol;

    console.log('Switched to trading pair:', currentTradingPair);

    // Update pair display in UI
    updateTradingPairUI();

    // Fetch new price data immediately
    updateBasePriceFromAPI();

    // Update chart and order book
    updatePriceChart();
    updateOrderBook();
}

// Function to update trading pair in UI
function updateTradingPairUI() {
    const pairInfo = getCurrentPairInfo();

    // Update pair name in header
    const pairNameElements = document.querySelectorAll('.pair-name');
    pairNameElements.forEach(el => {
        el.textContent = pairInfo.name;
    });

    // Update active pair button
    const pairButtons = document.querySelectorAll('.pair-button');
    pairButtons.forEach(btn => {
        if (btn.textContent.includes(pairInfo.name)) {
            btn.classList.add('active-pair');
        } else {
            btn.classList.remove('active-pair');
        }
    });

    // Update coin icon
    const pairIcon = document.getElementById('pair-icon');
    if (pairIcon) {
        // Extract coin symbol from pair name (e.g., BTC from BTC/USDT)
        const coinSymbol = pairInfo.name.split('/')[0].toLowerCase();
        pairIcon.src = `https://cryptologos.cc/logos/${coinSymbol}-${coinSymbol}-logo.png`;
        pairIcon.alt = coinSymbol.toUpperCase();
    }

    // Flash effect on pair change
    const liveHeader = document.querySelector('.live-trading-header');
    if (liveHeader) {
        liveHeader.classList.add('pair-changed');
        setTimeout(() => {
            liveHeader.classList.remove('pair-changed');
        }, 500);
    }

    // Update coin indicator in trend visualization
    const coinPair = document.querySelector('.coin-pair');
    if (coinPair) {
        coinPair.textContent = pairInfo.name;
    }
}

// Function to fetch real-time price data from Binance API
async function updateBasePriceFromAPI() {
    try {
        // Fetch current trading pair price from Binance public API
        const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${currentTradingPair}`);
        const data = await response.json();

        if (data && data.price) {
            // Update the global base price
            currentBasePrice = parseFloat(data.price);
            console.log(`Updated ${currentTradingPair} price from API:`, currentBasePrice);

            // Update the price display
            const lastPrice = document.getElementById('lastPrice');
            if (lastPrice) {
                lastPrice.textContent = `$${parseFloat(currentBasePrice).toFixed(2)}`;
                lastPrice.classList.add('price-updated');
                setTimeout(() => {
                    lastPrice.classList.remove('price-updated');
                }, 500);
            }

            // Update pair name
            const pairInfo = getCurrentPairInfo();
            const pairNameElement = document.querySelector('.current-pair-name');
            if (pairNameElement) {
                pairNameElement.textContent = pairInfo.name;
            }
        }
    } catch (error) {
        console.error(`Error fetching ${currentTradingPair} price from API:`, error);
        // If API fails, we'll continue using the last known price
    }
}

// Set up timer to update base price every 10 seconds
setInterval(updateBasePriceFromAPI, 10000);

// Set up timer to change trading pair every 30 seconds
setInterval(changeTradingPair, 30000);

// Call once immediately to get initial price
updateBasePriceFromAPI();

// Add this function to generate random price movements
function generateRandomTrade() {
    // Use the global base price that gets updated from API
    const basePrice = currentBasePrice;
    const volatility = 0.002; // 0.2% volatility
    const randomWalk = (Math.random() - 0.5) * volatility;

    // Array of exchanges with embedded SVG data
    const exchanges = [
        { name: 'Binance', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2YwYjkwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjA2NC04LjY0bDMuMDIxIDMuMDIgNy4wNzgtNy4wODQtMy4wMi0zLjAyLTQuMDU4IDQuMDU4LTQuMDU3LTQuMDU4LTMuMDIgMy4wMiA3LjA1NiA3LjA2NHptLTcuMDc4LTQuMDU3bDMuMDIxIDMuMDIgMy4wMi0zLjAyLTMuMDItMy4wMjEtMy4wMjEgMy4wMnptMTQuMTM1IDBsMy4wMiAzLjAyIDMuMDItMy4wMi0zLjAyLTMuMDIxLTMuMDIgMy4wMnptLTcuMDU3LTcuMDU3bDMuMDIgMy4wMiAzLjAyLTMuMDItMy4wMi0zLjAyLTMuMDIgMy4wMnoiLz48L3N2Zz4=', price: 45123.45 },
        { name: 'KuCoin', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIzQkY3NiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI2Ljk4NWMtNi4wNDYgMC0xMC45ODYgNC45NC0xMC45ODYgMTAuOTg1UzkuOTU0IDI2Ljk4NSAxNiAyNi45ODVzMTAuOTg2LTQuOTQgMTAuOTg2LTEwLjk4NVMyMi4wNDYgNS4wMTUgMTYgNS4wMTV6bS0uOTg0IDEyLjk4M2wtMy4wMTMtMy4wMTMgMS40MTQtMS40MTQgMS41OTkgMS41OTkgNS4zOTgtNS4zOTggMS40MTQgMS40MTQtNi44MTIgNi44MTJ6Ii8+PC9zdmc+', price: 45098.32 },
        { name: 'Coinbase', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwNTJGRiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0wLTI4QzkuMzY4IDQgNCAxMC4zNjggNCAxN3M1LjM2OCAxMiAxMiAxMiAxMi01LjM2OCAxMi0xMlMyMi42MzIgNCAxNiA0em0zLjU4MiAxNS45NTNjLS4xNTUuMzYtLjQyLjY1NC0uNzg0Ljg3NC0uMzYzLjIyLS44MjUuMzMtMS4zNjMuMzMtLjYxIDAtMS4xNS0uMTYtMS42Mi0uNDgzLS40Ny0uMzIyLS43OTgtLjc5My0uOTg0LTEuNDFsMS44NS0uNzY1Yy4wOTQuMjY3LjIyNy40NjYuMzk4LjU5OC4xNy4xMzIuMzY4LjE5OC41OTIuMTk4LjIyIDAgLjQwNi0uMDQ3LjU1OC0uMTQyLjE1Mi0uMDk0LjIyOC0uMjI3LjIyOC0uNHYtNi4xMzhoMi4xMjV2Ni4zMzh6bS0xLjg4Mi04LjQ2N2MtLjUxNi0uNDctMS4xMy0uNzA0LTEuODQtLjcwNC0uNzEgMC0xLjMyNC4yMzQtMS44NC43MDQtLjUxNi40Ny0uNzc1IDEuMDQzLS43NzUgMS43MnMuMjU4IDEuMjUyLjc3NSAxLjcyYy41MTYuNDcgMS4xMy43MDQgMS44NC43MDQuNzEgMCAxLjMyNC0uMjM0IDEuODQtLjcwNC41MTYtLjQ3Ljc3NS0xLjA0My43NzUtMS43MnMtLjI1OC0xLjI1Mi0uNzc1LTEuNzJ6TTEwLjk1MyAxOC42M2MtLjYxIDAtMS4xNS0uMTYtMS42Mi0uNDgzLS40Ny0uMzIyLS43OTgtLjc5My0uOTg0LTEuNDFsMS44NS0uNzY1Yy4wOTQuMjY3LjIyNy40NjYuMzk4LjU5OC4xNy4xMzIuMzY4LjE5OC41OTIuMTk4LjIyIDAgLjQwNi0uMDQ3LjU1OC0uMTQyLjE1Mi0uMDk0LjIyOC0uMjI3LjIyOC0uNHYtNi4xMzhoMi4xMjV2Ni4zMzhjLS4xNTUuMzYtLjQyLjY1NC0uNzg0Ljg3NC0uMzYzLjIyLS44MjUuMzMtMS4zNjMuMzN6TTkuMjM0IDkuODg3Yy41MTYuNDcgMS4xMy43MDQgMS44NC43MDQuNzEgMCAxLjMyNC0uMjM0IDEuODQtLjcwNC41MTYtLjQ3Ljc3NS0xLjA0My43NzUtMS43MnMtLjI1OC0xLjI1Mi0uNzc1LTEuNzJjLS41MTYtLjQ3LTEuMTMtLjcwNC0xLjg0LS43MDQtLjcxIDAtMS4zMjQuMjM0LTEuODQuNzA0LS41MTYuNDctLjc3NSAxLjA0My0uNzc1IDEuNzJzLjI1OCAxLjI1Mi43NzUgMS43MnoiLz48L3N2Zz4=', price: 45156.78 },
        { name: 'Crypto.com', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzAwMzNhZCIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tLjAxOC03LjkwM2wzLjA3LTEuNzc0YS43NzIuNzcyIDAgMCAwIC4zODYtLjY3MlYxMi4zNWEuNzcyLjc3MiAwIDAgMC0uMzg2LS42NzJsLTMuMDctMS43NzRhLjc3Mi43NzIgMCAwIDAtLjc3MiAwbC0zLjA3IDEuNzc0YS43NzIuNzcyIDAgMCAwLS4zODYuNjcydjcuMzAxYzAgLjI3Ny4xNDYuNTM0LjM4Ni42NzJsMy4wNyAxLjc3NGEuNzcyLjc3MiAwIDAgMCAuNzcyIDB6bS0yLjUwMi0yLjQ0NmMwIC4wNjktLjAzNS4xMDQtLjEwNC4xMDRoLS40MTRjLS4wNyAwLS4xMDQtLjAzNS0uMTA0LS4xMDR2LTUuMjA4YzAtLjA3LjAzNC0uMTA0LjEwNC0uMTA0aC40MTRjLjA2OSAwIC4xMDQuMDM1LjEwNC4xMDR2NS4yMDh6bTEuNTU0IDBjMCAuMDY5LS4wMzUuMTA0LS4xMDQuMTA0aC0uNDE0Yy0uMDcgMC0uMTA0LS4wMzUtLjEwNC0uMTA0di01LjIwOGMwLS4wNy4wMzQtLjEwNC4xMDQtLjEwNGguNDE0Yy4wNjkgMCAuMTA0LjAzNS4xMDQuMTA0djUuMjA4em0xLjU1NCAwYzAgLjA2OS0uMDM1LjEwNC0uMTA0LjEwNGgtLjQxNGMtLjA3IDAtLjEwNC0uMDM1LS4xMDQtLjEwNHYtNS4yMDhjMC0uMDcuMDM0LS4xMDQuMTA0LS4xMDRoLjQxNGMuMDY5IDAgLjEwNC4wMzUuMTA0LjEwNHY1LjIwOHoiLz48L3N2Zz4=', price: 45087.65 },
        { name: 'OKX', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iIzIxNmZlYSIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNy4xMDUtMTAuMDI1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXptLTkuNDk1LTkuNDk1YzAgMi42MjUgMi4xMjMgNC43NSA0Ljc0OCA0Ljc1czQuNzQ4LTIuMTI1IDQuNzQ4LTQuNzUtMi4xMjMtNC43NS00Ljc0OC00Ljc1LTQuNzQ4IDIuMTI1LTQuNzQ4IDQuNzV6bTkuNDk1IDBjMCAyLjYyNSAyLjEyMyA0Ljc1IDQuNzQ4IDQuNzVzNC43NDgtMi4xMjUgNC43NDgtNC43NS0yLjEyMy00Ljc1LTQuNzQ4LTQuNzUtNC43NDggMi4xMjUtNC43NDggNC43NXoiLz48L3N2Zz4=', price: 45112.89 },
        { name: 'Gate.io', icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzMiAzMiI+PHBhdGggZmlsbD0iI2Y0YjgwYiIgZD0iTTE2IDMyQzcuMTYzIDMyIDAgMjQuODM3IDAgMTZTNy4xNjMgMCAxNiAwczE2IDcuMTYzIDE2IDE2LTcuMTYzIDE2LTE2IDE2em0tNS40NjYtMTIuNzY2YzAgMy4yNTUgMi42NCA1Ljg5NiA1Ljg5NiA1Ljg5NnM1Ljg5Ni0yLjY0IDUuODk2LTUuODk2LTIuNjQtNS44OTYtNS44OTYtNS44OTYtNS44OTYgMi42NC01Ljg5NiA1Ljg5NnptNS44OTYtMy45M2MyLjE3IDAgMy45MyAxLjc2IDMuOTMgMy45M3MtMS43NiAzLjkzLTMuOTMgMy45My0zLjkzLTEuNzYtMy45My0zLjkzIDEuNzYtMy45MyAzLjkzLTMuOTN6bTAgMS45NjVjLTEuMDg1IDAtMS45NjUuODgtMS45NjUgMS45NjVzLjg4IDEuOTY1IDEuOTY1IDEuOTY1IDEuOTY1LS44OCAxLjk2NS0xLjk2NS0uODgtMS45NjUtMS45NjUtMS45NjV6Ii8+PC9zdmc+', price: 45076.21 }
    ];

    // Get current active exchange
    const activeExchange = document.querySelector('.exchange-card.active');
    let exchangeIndex = 0;

    if (activeExchange && activeExchange.querySelector('.exchange-name')) {
        const exchangeName = activeExchange.querySelector('.exchange-name').textContent;
        exchangeIndex = exchanges.findIndex(e => e.name === exchangeName);
        if (exchangeIndex === -1) exchangeIndex = 0;
    }

    return {
        p: (basePrice * (1 + randomWalk)).toFixed(2),
        q: (Math.random() * 2).toFixed(5),
        T: Date.now(),
        m: Math.random() > 0.5,
        e: exchanges[exchangeIndex]
    };
}

// Function to add a trade to the market data list
function addTradeToList(trade) {
    const marketData = document.getElementById('marketData');
    if (!marketData) return;

    // Create a new market item
    const item = document.createElement('div');
    item.className = `market-item ${trade.m ? 'price-up' : 'price-down'}`;

    // Format the time
    const date = new Date(trade.T);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
    const timeString = `${hours}:${minutes}:${seconds}.${milliseconds}`;

    // Get current pair symbol (BTC, ETH, etc.)
    const pairInfo = getCurrentPairInfo();
    const coinSymbol = pairInfo.name.split('/')[0];

    // Add the content - with classes for mobile optimization
    item.innerHTML = `
        <span class="trade-type">${trade.m ? 'BUY' : 'SELL'}</span>
        <span class="exchange-name">${trade.e && trade.e.icon ? `<img src="${trade.e.icon}" class="exchange-icon" alt="${trade.e.name}"> ${trade.e.name}` : 'Exchange'}</span>
        <span class="price-value">${trade.p}</span>
        <span class="trade-amount">${trade.q} ${coinSymbol}</span>
        <span class="trade-time">${timeString}</span>
    `;

    // Add to the market data container (after the header)
    const header = marketData.querySelector('.market-header');
    if (header && header.nextSibling) {
        marketData.insertBefore(item, header.nextSibling);
    } else {
        marketData.appendChild(item);
    }

    // Limit the number of items to prevent performance issues
    const items = marketData.querySelectorAll('.market-item:not(.market-header)');
    if (items.length > 100) {
        marketData.removeChild(items[items.length - 1]);
    }
}

// Function to update the last price display
function updateLastPrice(price) {
    const lastPrice = document.getElementById('lastPrice');
    if (!lastPrice) return;

    // Update the price
    lastPrice.textContent = `$${price}`;

    // Add animation class
    lastPrice.classList.add('price-updated');

    // Remove the class after animation completes
    setTimeout(() => {
        lastPrice.classList.remove('price-updated');
    }, 1000);
}

// Modify the WebSocket section to use simulated data
let tradeDataInterval = null;

function initSimulatedData() {
    // Clear any existing interval
    if (tradeDataInterval) {
        clearInterval(tradeDataInterval);
    }

    // Generate new trade data every 100ms (very fast updates)
    tradeDataInterval = setInterval(() => {
        const trade = generateRandomTrade();
        addTradeToList(trade);
        updateLastPrice(trade.p);
    }, 150); // Very fast updates for market data

    // Update trend line more frequently for smoother animation
    setInterval(() => {
        updateTrendLine();
    }, 30); // Ultra-fast updates for chart animation
}

// Function to update the trend line
function updateTrendLine() {
    const trendPath = document.querySelector('.trend-path');
    const trendProfit = document.querySelector('.trend-profit');
    if (!trendPath) return;

    // Get current path data
    const currentPath = trendPath.getAttribute('d');
    const pathParts = currentPath.split(' ');

    // Extract the last point
    const lastPoint = pathParts[pathParts.length - 2] + ' ' + pathParts[pathParts.length - 1];
    const [x, y] = lastPoint.split(',').map(Number);

    // Calculate new point (mostly trending upward)
    const newX = x + 3; // Even smaller steps for smoother animation
    let newY;

    if (Math.random() > 0.1) { // 90% chance to go up
        // Upward trend with varying intensity
        const upwardIntensity = Math.random() * 15;
        newY = Math.max(10, y - upwardIntensity);
    } else {
        // 10% chance to go down (very small drops)
        const downwardIntensity = Math.random() * 5;
        newY = Math.min(290, y + downwardIntensity);
    }

    // Add new point to path
    const newPath = currentPath + ` L${newX},${newY}`;

    // If path gets too long, remove oldest points
    if (pathParts.length > 80) { // Allow for even longer path
        const newPathParts = newPath.split(' ');
        const trimmedPath = newPathParts.slice(3).join(' ');
        trendPath.setAttribute('d', trimmedPath);
    } else {
        trendPath.setAttribute('d', newPath);
    }
}

// Enhanced Trading Animation System
class TradingAnimationSystem {
    constructor() {
        this.sparkles = [];
        this.initSparkles();
        this.initPriceJumper();
        this.initGrowthIndicators();
    }

    initSparkles() {
        const container = document.querySelector('.live-trading-container');
        if (!container) return;

        for (let i = 0; i < 10; i++) {
            this.createSparkle(container);
        }
    }

    createSparkle(container) {
        if (!container) return;

        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.style.left = `${Math.random() * 100}%`;
        sparkle.style.top = `${Math.random() * 100}%`;
        sparkle.style.animationDelay = `${Math.random() * 2}s`;
        container.appendChild(sparkle);
        this.sparkles.push(sparkle);
    }

    initPriceJumper() {
        const jumper = document.querySelector('.price-jumper');
        if (!jumper) return;

        const currentPriceElement = document.getElementById('currentPrice');
        if (!currentPriceElement) return;

        setInterval(() => {
            const randomChange = (Math.random() - 0.5) * 100;
            const currentPrice = parseFloat(currentPriceElement.textContent.replace('$', ''));
            const newPrice = (currentPrice + randomChange).toFixed(2);

            this.updatePrice(newPrice, randomChange > 0);
        }, 2000);
    }

    updatePrice(price, isUp) {
        const priceElement = document.getElementById('currentPrice');
        if (!priceElement) return;

        priceElement.innerHTML = `$${price}`;
        priceElement.className = `jumper-price ${isUp ? 'price-up' : 'price-down'}`;

        // Add flash effect
        const flash = document.createElement('div');
        flash.className = `price-flash ${isUp ? 'flash-green' : 'flash-red'}`;
        priceElement.appendChild(flash);

        setTimeout(() => flash.remove(), 1000);

        // Update trend arrow
        const arrow = document.querySelector('.trend-arrow');
        if (arrow) {
            arrow.textContent = isUp ? '↑' : '↓';
            arrow.className = `trend-arrow ${isUp ? 'up' : 'down'}`;
        }
    }

    initGrowthIndicators() {
        setInterval(() => {
            const bars = document.querySelectorAll('.growth-bar');
            if (bars.length === 0) return;

            bars.forEach(bar => {
                const randomHeight = 30 + Math.random() * 40;
                bar.style.height = `${randomHeight}%`;
            });
        }, 3000);
    }
}

// Single DOMContentLoaded event listener for all initializations
window.addEventListener('DOMContentLoaded', function() {
    // Add a global error handler to prevent errors from breaking the page
    window.addEventListener('error', function(e) {
        console.warn('Caught error:', e.message);
        // Prevent the error from breaking the page
        e.preventDefault();
        return true;
    });

    try {
        // Market data initialization
        const marketData = document.getElementById('marketData');
        const loading = document.getElementById('loading');

        // Add responsive styles
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                body {
                    padding: 0 !important;
                    margin: 0 !important;
                    overflow-x: hidden;
                }

                .content-wrapper {
                    padding: 0 !important;
                    margin: 0 !important;
                }

                .live-trading-container {
                    grid-template-columns: 1fr !important;
                    gap: 10px;
                    margin-bottom: 15px;
                }

                .trading-layout {
                    grid-template-columns: 1fr !important;
                    margin-bottom: 10px;
                }

                /* Hide order book on mobile */
                .order-book {
                    display: none !important;
                }

                /* Make market data take full width and look more app-like */
                .market-data {
                    width: 100% !important;
                    height: 300px !important;
                    border-radius: 12px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                .market-item {
                    grid-template-columns: 1fr 1fr 1fr !important;
                    font-size: 12px !important;
                    gap: 10px !important;
                    padding: 10px 15px;
                }

                /* Show only type, exchange and price on mobile */
                .market-item .trade-amount {
                    display: none !important;
                }

                /* Improve header display on mobile */
                .live-trading-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 10px;
                    border-radius: 12px;
                    margin-bottom: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                /* Improve trading activation container on mobile */
                .trading-activation-container {
                    flex-direction: column;
                    gap: 15px;
                    border-radius: 12px;
                    padding: 15px;
                    margin-bottom: 15px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                .trading-activation-button {
                    width: 100%;
                    height: 50px;
                    border-radius: 25px;
                    font-size: 14px;
                    box-shadow: 0 4px 20px rgba(246, 70, 93, 0.4);
                }

                .trading-activation-button.active {
                    box-shadow: 0 4px 20px rgba(14, 203, 129, 0.4);
                }

                /* Improve profit stats display */
                .profit-stats {
                    width: 100%;
                    justify-content: space-between;
                    margin-top: 10px;
                }

                .pair-selector {
                    flex-wrap: wrap;
                    border-radius: 12px;
                    overflow: hidden;
                    margin-bottom: 10px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                /* Exchange cards responsive styles */
                .exchange-cards {
                    grid-template-columns: 1fr 1fr;
                    gap: 10px;
                }

                .exchange-card {
                    min-height: 150px;
                }

                .exchange-card-body {
                    padding: 10px;
                }

                .stat-label {
                    font-size: 10px;
                }

                .stat-value {
                    font-size: 12px;
                }

                .current-exchange-indicator {
                    font-size: 12px;
                    padding: 8px 12px;
                }

                .pair-button {
                    flex: 1 1 auto;
                    min-width: 80px;
                    font-size: 12px;
                    padding: 12px 8px;
                }

                .live-trading-container {
                    padding: 10px;
                    margin: 0;
                }

                .floating-stats {
                    flex-direction: column;
                }

                /* Improve market trend visualization on mobile */
                .market-trend-visualization {
                    height: 250px;
                    border-radius: 12px;
                    margin-bottom: 15px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                }

                .trend-indicators {
                    flex-wrap: wrap;
                    gap: 8px;
                }

                .trend-indicator {
                    font-size: 12px;
                    padding: 4px 8px;
                    border-radius: 12px;
                }


            }

            @media (max-width: 480px) {
                .live-trading-container {
                    grid-template-columns: 1fr !important;
                    gap: 8px;
                }

                .market-item {
                    grid-template-columns: 1fr 1fr !important;
                    font-size: 11px !important;
                    padding: 8px 12px;
                }

                /* Show only type and price on very small screens */
                .market-item .exchange-name {
                    display: none ;
                }

                /* Hide time column on very small screens */
                .market-item .trade-time {
                    display: none !important;
                }

                /* Make profit bubbles smaller on mobile */
                .floating-profit, .floating-loss {
                    font-size: 14px;
                    padding: 4px 8px;
                    border-radius: 12px;
                }

                .live-trading-header {
                    padding: 12px;
                    border-radius: 12px;
                }

                .header-info {
                    flex-direction: column;
                    align-items: stretch;
                    width: 100%;
                }

                #lastPrice {
                    width: 100%;
                    box-sizing: border-box;
                    justify-content: center;
                    border-radius: 8px;
                    margin-top: 5px;
                }

                /* Improve profit stats on very small screens */
                .profit-stats {
                    flex-direction: column;
                    gap: 8px;
                }

                .profit-stat {
                    width: 100%;
                    border-radius: 8px;
                    padding: 10px;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
                }

                /* Make pair buttons smaller */
                .pair-button {
                    min-width: 70px;
                    font-size: 11px;
                    padding: 10px 6px;
                }

                /* Exchange cards for very small screens */
                .exchange-cards {
                    grid-template-columns: 1fr;
                }

                .exchange-card {
                    min-height: auto;
                }

                .exchange-card-header {
                    padding: 10px;
                }

                .exchange-logo {
                    width: 24px;
                    height: 24px;
                }

                .exchange-name {
                    font-size: 14px;
                }

                .current-exchange-indicator {
                    font-size: 11px;
                    padding: 6px 10px;
                }

                /* Adjust trend visualization for very small screens */
                .market-trend-visualization {
                    height: 200px;
                    border-radius: 12px;
                }

                .trend-profit {
                    font-size: 20px;
                }

                /* Make activation button more prominent */
                .trading-activation-button {
                    height: 46px;
                    font-size: 13px;
                }


            }
        `;
        document.head.appendChild(style);

        // Market data and WebSocket initialization
        if (marketData && loading) {
            let currentPair = 'btcusdt';

            // Initialize WebSocket function
            function initWebSocket(pair) {
                // This is a placeholder function since we're using simulated data
                console.log(`WebSocket would connect to ${pair} in a real implementation`);
                // Hide loading indicator
                loading.style.display = 'none';
            }

            // Don't initialize simulated data automatically
            // It will be started when the user clicks the activation button

            // Initialize exchange selector events
            const exchangeCards = document.querySelectorAll('.exchange-card');
            const currentExchangeName = document.getElementById('current-exchange-name');

            // Add CSS for exchange switch message
            const switchStyle = document.createElement('style');
            switchStyle.textContent = `
                .exchange-switch-message {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(240, 185, 11, 0.9);
                    color: white;
                    padding: 20px 40px;
                    border-radius: 30px;
                    font-weight: 600;
                    font-size: 18px;
                    box-shadow: 0 0 30px rgba(240, 185, 11, 0.7);
                    z-index: 9999;
                    opacity: 1;
                    transition: opacity 0.5s ease;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .switch-icon {
                    width: 24px;
                    height: 24px;
                    border: 2px solid white;
                    border-radius: 50%;
                    border-top-color: transparent;
                    animation: spin 1s linear infinite;
                }

                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                @keyframes cardPulse {
                    0% { transform: translateY(-5px); box-shadow: 0 5px 20px rgba(240, 185, 11, 0.3); }
                    50% { transform: translateY(-8px); box-shadow: 0 8px 25px rgba(240, 185, 11, 0.5); }
                    100% { transform: translateY(-5px); box-shadow: 0 5px 20px rgba(240, 185, 11, 0.3); }
                }

                .exchange-card.active {
                    animation: cardPulse 1.5s infinite ease-in-out;
                }

                @keyframes exchangeSwitch {
                    0% { transform: translateX(0) scale(1); opacity: 1; }
                    20% { transform: translateX(-10px) scale(0.95); opacity: 0.8; }
                    100% { transform: translateX(0) scale(1); opacity: 1; }
                }

                .exchange-switch-animation {
                    animation: exchangeSwitch 0.5s ease-out;
                }

                .exchange-status-change {
                    animation: statusFade 0.5s forwards;
                }

                @keyframes statusFade {
                    from { opacity: 0; transform: scale(0.8); }
                    to { opacity: 1; transform: scale(1); }
                }
            `;
            document.head.appendChild(switchStyle);

            if (exchangeCards && exchangeCards.length > 0) {
                exchangeCards.forEach(card => {
                    card.addEventListener('click', () => {
                        if (!tradingActive) {
                            // Show message that trading needs to be activated first
                            const message = document.createElement('div');
                            message.className = 'activation-message';
                            message.style.background = 'rgba(246, 70, 93, 0.9)';
                            message.style.boxShadow = '0 0 30px rgba(246, 70, 93, 0.7)';
                            message.textContent = 'Activate Trading First';
                            document.body.appendChild(message);

                            setTimeout(() => {
                                message.style.opacity = '0';
                                setTimeout(() => message.remove(), 500);
                            }, 2000);
                            return;
                        }

                        if (card.classList.contains('active')) return;

                        // Get exchange name
                        const exchangeName = card.querySelector('.exchange-name').textContent;

                        // No switching animation - just update the data immediately

                        // Update active card immediately without animations
                        const activeCard = document.querySelector('.exchange-card.active');
                        if (activeCard) {
                            // Update status of previously active card
                            const prevStatus = activeCard.querySelector('.exchange-status');
                            if (prevStatus) {
                                prevStatus.textContent = 'Ready';
                                prevStatus.classList.remove('active');
                            }
                            activeCard.classList.remove('active');
                        }

                        // Update new active card
                        card.classList.add('active');
                        const newStatus = card.querySelector('.exchange-status');
                        if (newStatus) {
                            newStatus.textContent = 'Connected';
                            newStatus.classList.add('active');
                        }

                        // Update current exchange indicator
                        if (currentExchangeName) {
                            currentExchangeName.textContent = exchangeName;
                        }

                        // Immediately update all data
                        updateMarketDataWithExchange();
                        updatePriceChart();
                    });
                });
            }

            // Initialize pair selector events
            const pairButtons = document.querySelectorAll('.pair-button');
            if (pairButtons && pairButtons.length > 0) {
                pairButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        if (!tradingActive) {
                            // Show message that trading needs to be activated first
                            const message = document.createElement('div');
                            message.className = 'activation-message';
                            message.style.background = 'rgba(246, 70, 93, 0.9)';
                            message.style.boxShadow = '0 0 30px rgba(246, 70, 93, 0.7)';
                            message.textContent = 'Activate Trading First';
                            document.body.appendChild(message);

                            setTimeout(() => {
                                message.style.opacity = '0';
                                setTimeout(() => message.remove(), 500);
                            }, 2000);
                            return;
                        }

                        if (button.classList.contains('active')) return;

                        const activeButton = document.querySelector('.pair-button.active');
                        if (activeButton) {
                            activeButton.classList.remove('active');
                        }
                        button.classList.add('active');

                        currentPair = button.dataset.pair;
                        marketData.innerHTML = '<div class="market-item market-header"><span class="trade-type">Type</span><span class="exchange-name">Exchange</span><span class="price-value">Price (USDT)</span><span class="trade-amount">Amount</span><span class="trade-time">Time</span></div>';
                        initWebSocket(currentPair);
                    });
                });
            }

            // Initialize trading form tabs
            const formTabs = document.querySelectorAll('.trading-form-tab');
            if (formTabs && formTabs.length > 0) {
                formTabs.forEach(tab => {
                    tab.addEventListener('click', () => {
                        if (tab.classList.contains('active')) return;

                        document.querySelector('.trading-form-tab.active')?.classList.remove('active');
                        tab.classList.add('active');
                    });
                });
            }

            // Initialize order book controls
            const orderBookControls = document.querySelectorAll('.order-book-control');
            if (orderBookControls && orderBookControls.length > 0) {
                orderBookControls.forEach(control => {
                    control.addEventListener('click', () => {
                        if (control.classList.contains('active')) return;

                        document.querySelector('.order-book-control.active')?.classList.remove('active');
                        control.classList.add('active');
                    });
                });
            }

            // Initialize slider options
            const sliderOptions = document.querySelectorAll('.slider-option');
            if (sliderOptions && sliderOptions.length > 0) {
                sliderOptions.forEach(option => {
                    option.addEventListener('click', () => {
                        // Highlight the selected option
                        sliderOptions.forEach(opt => opt.style.background = '');
                        option.style.background = 'rgba(240, 185, 11, 0.1)';
                        option.style.color = '#f0b90b';
                    });
                });
            }

            // Call the function to initialize
            initWebSocket(currentPair);
        }

        // Initialize animation system
        const tradingAnimations = new TradingAnimationSystem();

        // Initialize wave animations
        const waves = document.querySelector('.volume-waves');
        if (waves) {
            setInterval(() => {
                waves.style.opacity = 0.5 + Math.random() * 0.5;
            }, 1000);
        }

        // Add sparkle burst effect
        const addSparklesBurst = () => {
            const container = document.querySelector('.live-trading-container');
            if (container) {
                for (let i = 0; i < 5; i++) {
                    setTimeout(() => {
                        tradingAnimations.createSparkle(container);
                    }, i * 100);
                }
            }
        };

        setInterval(addSparklesBurst, 5000);

        // Initialize market trend visualization
        const trendNumbers = document.querySelector('.trend-numbers');
        const trendCandles = document.querySelector('.trend-candles');
        const percentIndicator = document.querySelector('.trend-indicators .trend-indicator:nth-child(2)');

        if (trendNumbers) {
            // Create random numbers that appear and fade out
            function createRandomNumber() {
                const number = document.createElement('div');
                number.className = `trend-number ${Math.random() > 0.2 ? 'trend-number-green' : 'trend-number-red'}`;

                // Random position
                number.style.left = `${Math.random() * 90}%`;
                number.style.top = `${Math.random() * 90}%`;

                // Random value (mostly positive to show upward trend)
                const value = Math.random() > 0.2 ?
                    `+${(Math.random() * 5).toFixed(2)}%` :
                    `-${(Math.random() * 2).toFixed(2)}%`;

                number.textContent = value;

                // Add to container
                trendNumbers.appendChild(number);

                // Remove after animation completes
                setTimeout(() => {
                    number.remove();
                }, 5000);
            }

            // Create numbers periodically
            setInterval(createRandomNumber, 300); // More frequent numbers

            // Create initial batch of numbers
            for (let i = 0; i < 15; i++) {
                setTimeout(createRandomNumber, i * 200);
            }
        }

        // Create and animate candles
        if (trendCandles) {
            function createCandle() {
                const candle = document.createElement('div');
                candle.className = `candle ${Math.random() > 0.3 ? '' : 'red'}`;

                // Random position and height
                const left = Math.random() * 100;
                const height = 20 + Math.random() * 200;

                candle.style.left = `${left}%`;
                candle.style.height = `${height}px`;

                // Add to container
                trendCandles.appendChild(candle);

                // Animate and remove
                setTimeout(() => {
                    candle.style.opacity = '0';
                    setTimeout(() => candle.remove(), 1000);
                }, 3000);
            }

            // Create candles periodically
            setInterval(createCandle, 200);

            // Create initial batch of candles
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    createCandle();
                }, i * 100);
            }
        }

        // Create particles
        const trendParticles = document.querySelector('.trend-particles');
        if (trendParticles) {
            function createParticle() {
                const particle = document.createElement('div');
                particle.className = 'particle';

                // Random position
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.bottom = '0';

                // Add to container
                trendParticles.appendChild(particle);

                // Remove after animation completes
                setTimeout(() => particle.remove(), 3000);
            }

            // Create particles periodically
            setInterval(createParticle, 300);

            // Create initial batch of particles
            for (let i = 0; i < 15; i++) {
                setTimeout(createParticle, i * 200);
            }
        }

        // Create volume bars
        const volumeBars = document.querySelector('.trend-volume-bars');
        if (volumeBars) {
            // Create initial volume bars
            for (let i = 0; i < 50; i++) {
                const bar = document.createElement('div');
                bar.className = `volume-bar ${Math.random() > 0.3 ? '' : 'red'}`;
                bar.style.height = `${Math.random() * 100}%`;
                volumeBars.appendChild(bar);
            }

            // Animate volume bars
            setInterval(() => {
                const bars = volumeBars.querySelectorAll('.volume-bar');
                bars.forEach(bar => {
                    const newHeight = Math.random() * 100;
                    bar.style.height = `${newHeight}%`;

                    // Randomly change color
                    if (Math.random() > 0.9) {
                        bar.className = `volume-bar ${Math.random() > 0.3 ? '' : 'red'}`;
                    }
                });
            }, 500);
        }

        // Create price markers
        const priceMarkers = document.querySelector('.trend-price-markers');
        if (priceMarkers) {
            const basePrice = 45000;
            const priceRange = 2000;

            // Create price markers
            for (let i = 0; i < 5; i++) {
                const marker = document.createElement('div');
                marker.className = 'price-marker';
                const price = basePrice + priceRange - (i * (priceRange / 4));
                marker.textContent = `$${price.toFixed(0)}`;
                priceMarkers.appendChild(marker);
            }
        }

        // Update percentage indicator
        if (percentIndicator) {
            let currentPercent = 12.45;
            let trend = 1; // 1 for up, -1 for down

            setInterval(() => {
                // 80% chance to continue trend, 20% to reverse
                if (Math.random() > 0.8) {
                    trend = -trend;
                }

                // Update percentage
                const change = Math.random() * 0.5 * trend;
                currentPercent += change;

                // Keep within reasonable bounds
                if (currentPercent > 25) currentPercent = 25;
                if (currentPercent < -5) currentPercent = -5;

                // Update display
                const sign = currentPercent >= 0 ? '+' : '';
                percentIndicator.textContent = `${sign}${currentPercent.toFixed(2)}%`;

                // Update color
                if (currentPercent >= 0) {
                    percentIndicator.style.color = '#0ecb81';
                } else {
                    percentIndicator.style.color = '#f6465d';
                }
            }, 1000);
        }

        // Handle trading activation button
        const activationButton = document.querySelector('.trading-activation-button');
        const statusIndicator = document.querySelector('.status-indicator');
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        const sessionTimeValue = document.querySelector('.status-time-value');
        const profitValue = document.querySelector('.profit-value');
        const floatingProfitsContainer = document.querySelector('.floating-profits-container');
        const coinPair = document.querySelector('.coin-pair');

        let tradingActive = <?php echo $trade_active ? 'true' : 'false'; ?>;
        let seconds = 0;
        let timerInterval = null;
        let profitInterval = null;
        let totalProfit = 0;
        let activeTrades = 0;
        let currentCoin = 'BTC';

        // Array of coins to cycle through
        const coins = ['BTC', 'ETH', 'BNB', 'SOL', 'ADA', 'DOT', 'DOGE', 'XRP'];

        // Function to create floating profit/loss indicators
        function createFloatingProfit() {
            if (!floatingProfitsContainer || !tradingActive) return;

            // Create just one bubble at a time (reduced from 3)
            const profit = document.createElement('div');

            // Random position across the entire width with some variation
            profit.style.left = `${Math.random() * 80 + 10}%`;
            profit.style.bottom = '0'; // Start from the very bottom

            // More balanced profit/loss ratio (70% profit, 30% loss) for a more positive experience
            const isProfit = Math.random() > 0.003;
            const amount = isProfit ?
                (Math.random() * 0.005).toFixed(4) :
                (-Math.random() * 0.003).toFixed(4);

            // Set appropriate class based on profit/loss
            profit.className = isProfit ? 'floating-profit' : 'floating-loss';

            // Add icon to make it more attractive
            const icon = isProfit ? '↑' : '↓';
            profit.innerHTML = `${icon} ${amount > 0 ? '+' : ''}${amount} USDT`;

            // Add to container
            floatingProfitsContainer.appendChild(profit);

            // Add sound effect for better feedback (commented out to avoid autoplay issues)
            // const audio = new Audio(isProfit ? 'profit-sound.mp3' : 'loss-sound.mp3');
            // audio.volume = 0.2;
            // audio.play();

            // Update total profit with enhanced visual feedback
            if (profitValue) {
                // Calculate new profit
                const oldProfit = totalProfit;
                totalProfit += parseFloat(amount);

                // Animate the profit value change
                const animateValue = (start, end, duration, element) => {
                    let startTime = null;
                    const step = (timestamp) => {
                        if (!startTime) startTime = timestamp;
                        const progress = Math.min((timestamp - startTime) / duration, 1);
                        const currentValue = start + progress * (end - start);
                        element.textContent = `${currentValue > 0 ? '+' : ''}${currentValue.toFixed(2)} USDT`;
                        if (progress < 1) {
                            window.requestAnimationFrame(step);
                        }
                    };
                    window.requestAnimationFrame(step);
                };

                // Animate the profit value
                animateValue(oldProfit, totalProfit, 500, profitValue);
                profitValue.style.color = totalProfit >= 0 ? '#0ecb81' : '#f6465d';

                // Add pulse effect to profit value
                profitValue.style.transform = 'scale(1.1)';
                profitValue.style.textShadow = totalProfit >= 0 ?
                    '0 0 15px rgba(14, 203, 129, 0.8)' :
                    '0 0 15px rgba(246, 70, 93, 0.8)';

                setTimeout(() => {
                    profitValue.style.transform = 'scale(1)';
                    profitValue.style.textShadow = totalProfit >= 0 ?
                        '0 0 5px rgba(14, 203, 129, 0.5)' :
                        '0 0 5px rgba(246, 70, 93, 0.5)';
                }, 300);

                // Update the trend profit display with enhanced animation
                const trendProfit = document.querySelector('.trend-profit');
                if (trendProfit) {
                    // Animate trend profit value
                    animateValue(oldProfit, totalProfit, 500, trendProfit);
                    trendProfit.style.color = totalProfit >= 0 ? '#0ecb81' : '#f6465d';

                    // Add enhanced flash effect
                    trendProfit.style.fontSize = '30px';
                    trendProfit.style.textShadow = totalProfit >= 0 ?
                        '0 0 25px rgba(14, 203, 129, 0.9)' :
                        '0 0 25px rgba(246, 70, 93, 0.9)';

                    setTimeout(() => {
                        trendProfit.style.fontSize = '24px';
                        trendProfit.style.textShadow = totalProfit >= 0 ?
                            '0 0 10px rgba(14, 203, 129, 0.5)' :
                            '0 0 10px rgba(246, 70, 93, 0.5)';
                    }, 400);
                }

                // Update active trades count with visual feedback
                const activeTradesElement = document.querySelectorAll('.profit-value')[1];
                if (activeTradesElement) {

                     <?php
                           // Get active orders count
                    $active_orders_query = "SELECT COUNT(*) as active_count
                                          FROM trades
                                          WHERE status = 'completed'
                                          AND uid = '$uid'";
                    $active_result = my_query($active_orders_query);
                    $active_orders = mysqli_fetch_object($active_result)->active_count;


                    ?>
                    // Add visual feedback for trade count change
                    if (oldTrades !== activeTrades) {
                        activeTradesElement.style.transform = 'scale(1.2)';
                        activeTradesElement.style.color = change > 0 ? '#0ecb81' : '#f6465d';

                        setTimeout(() => {
                            activeTradesElement.style.transform = 'scale(1)';
                            activeTradesElement.style.color = '';
                        }, 300);
                    }

                    activeTradesElement.textContent = $active_orders;
                }
            }

            // Remove after animation completes
            setTimeout(() => {
                profit.classList.add('fade-out');
                setTimeout(() => profit.remove(), 500);
            }, 5500); // Slightly shorter to account for fade-out animation
        }

        // Function to change the current coin
        function changeCoin() {
            if (!coinPair || !tradingActive) return;

            // Get a random coin different from the current one
            let newCoin;
            do {
                newCoin = coins[Math.floor(Math.random() * coins.length)];
            } while (newCoin === currentCoin);

            currentCoin = newCoin;
            coinPair.textContent = `${currentCoin}/USDT`;

            // Flash the trend visualization
            const trendFlash = document.querySelector('.trend-flash');
            if (trendFlash) {
                trendFlash.style.opacity = '0.3';
                setTimeout(() => {
                    trendFlash.style.opacity = '0';
                }, 300);
            }
        }

        // Function to change exchange periodically
        function changeExchange() {
            if (!tradingActive) return;

            const exchangeCards = document.querySelectorAll('.exchange-card');
            if (!exchangeCards || exchangeCards.length === 0) return;

            const activeCard = document.querySelector('.exchange-card.active');
            if (!activeCard) return;

            const currentIndex = Array.from(exchangeCards).indexOf(activeCard);
            const nextIndex = (currentIndex + 1) % exchangeCards.length;

            // Immediately switch to next exchange without delay
            exchangeCards[nextIndex].click();

            // Update all data immediately
            updateAllExchangeCards();
            updateMarketDataWithExchange();
            updatePriceChart();

            // Update current exchange name in indicator
            const currentExchangeName = document.getElementById('current-exchange-name');
            if (currentExchangeName && exchangeCards[nextIndex].querySelector('.exchange-name')) {
                currentExchangeName.textContent = exchangeCards[nextIndex].querySelector('.exchange-name').textContent;
            }
        }

        // Function to update all exchange cards with dynamic data
        function updateAllExchangeCards() {
            const exchangeCards = document.querySelectorAll('.exchange-card');

            exchangeCards.forEach(card => {
                // Update volume
                const volumeValue = card.querySelector('.stat-value:first-of-type');
                if (volumeValue) {
                    const currentVolume = parseFloat(volumeValue.textContent.replace('$', '').replace('B', ''));
                    const newVolume = (currentVolume + (Math.random() * 0.4 - 0.2)).toFixed(1);
                    volumeValue.textContent = `$${newVolume}B`;

                    // Add flash effect if card is active
                    if (card.classList.contains('active')) {
                        volumeValue.style.color = '#f0b90b';
                        setTimeout(() => {
                            volumeValue.style.color = '';
                        }, 300);
                    }
                }

                // Update pairs
                const pairsValue = card.querySelector('.stat-value:nth-of-type(2)');
                if (pairsValue && Math.random() > 0.7) {
                    const currentPairs = parseInt(pairsValue.textContent.replace('+', ''));
                    const change = Math.floor(Math.random() * 5) * (Math.random() > 0.5 ? 1 : -1);
                    const newPairs = Math.max(300, currentPairs + change);
                    pairsValue.textContent = `${newPairs}+`;
                }

                // Update BTC price
                const priceValue = card.querySelector('.price-value');
                if (priceValue) {
                    const currentPrice = parseFloat(priceValue.textContent.replace('$', '').replace(',', ''));
                    const priceChange = (Math.random() * 20 - 10).toFixed(2);
                    const newPrice = (currentPrice + parseFloat(priceChange)).toFixed(2);

                    // Format with commas
                    const formattedPrice = '$' + parseFloat(newPrice).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });

                    // Add animation class for price change
                    priceValue.classList.add('price-change');
                    priceValue.textContent = formattedPrice;

                    setTimeout(() => {
                        priceValue.classList.remove('price-change');
                    }, 500);
                }

                // Add a subtle animation to the card
                card.classList.add('exchange-switch-animation');
                setTimeout(() => {
                    card.classList.remove('exchange-switch-animation');
                }, 500);
            });
        }

        // Function to update market data with current exchange
        function updateMarketDataWithExchange() {
            const activeCard = document.querySelector('.exchange-card.active');
            if (!activeCard) return;

            const exchangeNameEl = activeCard.querySelector('.exchange-name');
            if (!exchangeNameEl) return;

            const exchangeName = exchangeNameEl.textContent;
            const logoEl = activeCard.querySelector('.exchange-logo');
            if (!logoEl) return;

            const logoSrc = logoEl.src;

            // Clear existing market data and generate new data for this exchange
            const marketData = document.getElementById('marketData');
            if (marketData) {
                // Keep only the header
                const header = marketData.querySelector('.market-header');
                if (header) {
                    marketData.innerHTML = '';
                    marketData.appendChild(header);

                    // Generate new trade data for this exchange
                    for (let i = 0; i < 20; i++) {
                        const trade = generateRandomTrade();
                        addTradeToList(trade);
                    }
                }
            }

            // Update price display with real API data
            const lastPrice = document.getElementById('lastPrice');
            if (lastPrice) {
                // Use the current base price from API with small random variation
                const displayPrice = currentBasePrice * (1 + (Math.random() * 0.001 - 0.0005));
                lastPrice.textContent = `$${displayPrice.toFixed(2)}`;
                lastPrice.classList.add('price-updated');
                setTimeout(() => {
                    lastPrice.classList.remove('price-updated');
                }, 500);
            }

            // Update price change indicator with real data
            const priceChangeIndicator = document.querySelector('.price-change-indicator');
            if (priceChangeIndicator) {
                // Store previous price to calculate real change
                if (!window.previousBasePrice) {
                    window.previousBasePrice = currentBasePrice;
                }

                // Calculate actual percentage change
                const percentChange = ((currentBasePrice - window.previousBasePrice) / window.previousBasePrice * 100);
                const change = percentChange.toFixed(2);
                const isPositive = parseFloat(change) >= 0;

                priceChangeIndicator.textContent = `${isPositive ? '+' : ''}${change}%`;
                priceChangeIndicator.className = `price-change-indicator ${isPositive ? 'price-up-indicator' : 'price-down-indicator'}`;

                // Update previous price for next calculation
                window.previousBasePrice = currentBasePrice;
            }
        }

        // Function to update price chart when exchange changes
        function updatePriceChart() {
            const trendPath = document.querySelector('.trend-path');
            if (!trendPath) return;

            // Initialize price history if not exists
            if (!window.priceHistory) {
                window.priceHistory = [];
            }

            // Add current price to history
            window.priceHistory.push(currentBasePrice);

            // Keep only the last 11 points
            if (window.priceHistory.length > 11) {
                window.priceHistory = window.priceHistory.slice(-11);
            }

            // Generate path data based on real price history
            const points = [];
            const maxPrice = Math.max(...window.priceHistory) * 1.001; // Add 0.1% margin
            const minPrice = Math.min(...window.priceHistory) * 0.999; // Subtract 0.1% margin
            const priceRange = maxPrice - minPrice;

            // Generate points based on real price data
            for (let i = 0; i < window.priceHistory.length; i++) {
                const x = i * 100;
                // Map price to y coordinate (inverted, higher price = lower y)
                // Scale to fit in 200px height
                const normalizedPrice = (window.priceHistory[i] - minPrice) / priceRange;
                const y = 250 - (normalizedPrice * 200);
                points.push(`${x},${y}`);
            }

            // Create new path data
            const newPathData = `M${points.join(' L')}`;

            // Apply with animation
            trendPath.style.transition = 'none';
            trendPath.setAttribute('d', newPathData);

            // Flash effect on trend visualization
            const trendFlash = document.querySelector('.trend-flash');
            if (trendFlash) {
                trendFlash.style.opacity = '0.3';
                setTimeout(() => {
                    trendFlash.style.opacity = '0';
                }, 300);
            }
        }

        // Add inactive overlay to market data and other trading elements
        const marketDataOverlay = document.createElement('div');
        marketDataOverlay.className = 'inactive-overlay';
        marketDataOverlay.innerHTML = '<div class="overlay-message">Trading Inactive</div>';
        document.querySelector('.market-data').appendChild(marketDataOverlay);

        // Add inactive overlay to trend visualization
        const trendOverlay = document.createElement('div');
        trendOverlay.className = 'inactive-overlay';
        trendOverlay.innerHTML = '<div class="overlay-message">Trading Inactive</div>';
        document.querySelector('.market-trend-visualization').appendChild(trendOverlay);

        // Add inactive overlay to exchange selector
        const exchangeOverlay = document.createElement('div');
        exchangeOverlay.className = 'inactive-overlay';
        exchangeOverlay.innerHTML = '<div class="overlay-message">Trading Inactive</div>';
        document.querySelector('.exchange-selector').appendChild(exchangeOverlay);

        // Add CSS for inactive overlay
        const overlayStyle = document.createElement('style');
        overlayStyle.textContent = `
            .inactive-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 100;
                backdrop-filter: blur(3px);
                transition: all 0.5s ease;
            }

            .overlay-message {
                color: rgba(255, 255, 255, 0.7);
                font-size: 18px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 2px;
                background: rgba(0, 0, 0, 0.5);
                padding: 15px 30px;
                border-radius: 30px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }

            .inactive-overlay.hidden {
                opacity: 0;
                pointer-events: none;
            }

            .trading-active-indicator {
                position: fixed;
                top: 20px;
                right: 20px;
                background: linear-gradient(45deg, #0ecb81, #0bb974);
                color: white;
                padding: 8px 15px;
                border-radius: 20px;
                font-weight: 600;
                font-size: 14px;
                box-shadow: 0 4px 15px rgba(14, 203, 129, 0.5);
                z-index: 1000;
                display: flex;
                align-items: center;
                gap: 8px;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            }

            .trading-active-indicator.visible {
                opacity: 1;
                transform: translateY(0);
            }

            .indicator-dot {
                width: 8px;
                height: 8px;
                background: white;
                border-radius: 50%;
                animation: pulse 1.5s infinite;
            }
        `;
        document.head.appendChild(overlayStyle);

        // Create trading active indicator
        const activeIndicator = document.createElement('div');
        activeIndicator.className = 'trading-active-indicator';
        activeIndicator.innerHTML = '<div class="indicator-dot"></div> Trading Active';
        document.body.appendChild(activeIndicator);

        // Disable pair buttons initially
        const pairButtons = document.querySelectorAll('.pair-button');
        pairButtons.forEach(btn => {
            btn.style.opacity = '0.5';
            btn.style.pointerEvents = 'none';
        });

        // Initialize UI based on current trading status
        function updateTradingUI() {
            if (!activationButton || !statusIndicator || !statusText || !sessionTimeValue) return;

            if (tradingActive) {
                // Set active UI
                activationButton.classList.add('active');
                activationButton.innerHTML = '<div class="button-glow"></div><div class="button-pulse"></div><div class="button-content"><div class="button-icon"></div><span>TRADING ACTIVE</span></div>';
                statusText.textContent = 'Trading Active';
                statusText.className = 'status-text status-active';
                statusDot.className = 'status-dot';

                // Show active indicator
                if (activeIndicator) activeIndicator.classList.add('visible');

                // Hide overlays
                document.querySelectorAll('.inactive-overlay').forEach(overlay => {
                    overlay.classList.add('hidden');
                });

                // Enable pair buttons
                pairButtons.forEach(btn => {
                    btn.style.opacity = '1';
                    btn.style.pointerEvents = 'auto';
                });

                // Start all trading functionality
                startTradingFunctionality();
            } else {
                // Set inactive UI
                activationButton.classList.remove('active');
                activationButton.innerHTML = '<div class="button-glow"></div><div class="button-pulse"></div><div class="button-content"><div class="button-icon"></div><span>ACTIVATE TRADING</span></div>';
                statusText.textContent = 'Trading Inactive';
                statusText.className = 'status-text status-inactive';
                statusDot.className = 'status-dot status-inactive';

                // Hide active indicator
                if (activeIndicator) activeIndicator.classList.remove('visible');

                // Show overlays
                document.querySelectorAll('.inactive-overlay').forEach(overlay => {
                    overlay.classList.remove('hidden');
                });

                // Disable pair buttons
                pairButtons.forEach(btn => {
                    btn.style.opacity = '0.5';
                    btn.style.pointerEvents = 'none';
                });

                // Stop all intervals
                stopTradingFunctionality();
            }
        }

        // Function to start all trading functionality
        function startTradingFunctionality() {
            // Start timer with enhanced display
            seconds = 0;
            timerInterval = setInterval(() => {
                seconds++;
                const hours = Math.floor(seconds / 3600).toString().padStart(2, '0');
                const minutes = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
                const secs = (seconds % 60).toString().padStart(2, '0');
                sessionTimeValue.textContent = `${hours}:${minutes}:${secs}`;

                // Flash the time value for visual feedback
                sessionTimeValue.style.color = '#f0b90b';
                setTimeout(() => {
                    sessionTimeValue.style.color = '';
                }, 200);
            }, 1000);

            // Start generating trades with visual feedback
            const marketData = document.getElementById('marketData');
            if (marketData) {
                marketData.classList.add('active-data');
                initSimulatedData();
            }

            // Start generating floating profits with enhanced visuals
            profitInterval = setInterval(createFloatingProfit, 1000);

            // Change coin periodically with visual feedback
            const coinChangeInterval = setInterval(changeCoin, 15000);

            // Change exchange periodically (very frequently for better demo)
            const exchangeChangeInterval = setInterval(changeExchange, 5000);

            // Update exchange stats more frequently
            const exchangeStatsInterval = setInterval(() => {
                updateAllExchangeCards();
            }, 2000);

            // Update price chart more frequently
            const priceChartInterval = setInterval(() => {
                updatePriceChart();
            }, 3000);

            // Update market data with current exchange
            const marketDataInterval = setInterval(() => {
                // Add a single new trade to keep data flowing
                const trade = generateRandomTrade();
                addTradeToList(trade);
            }, 150);

            // Store intervals for cleanup
            window.tradingIntervals = {
                timer: timerInterval,
                profit: profitInterval,
                coin: coinChangeInterval,
                exchange: exchangeChangeInterval,
                exchangeStats: exchangeStatsInterval,
                priceChart: priceChartInterval,
                marketData: marketDataInterval
            };

            // Add activation success message
            const successMessage = document.createElement('div');
            successMessage.className = 'activation-message';
            successMessage.textContent = 'Trading Successfully Activated';
            document.body.appendChild(successMessage);

            setTimeout(() => {
                successMessage.style.opacity = '0';
                setTimeout(() => successMessage.remove(), 500);
            }, 2000);
        }

        // Function to stop all trading functionality
        function stopTradingFunctionality() {
            // Stop all intervals
            if (window.tradingIntervals) {
                Object.values(window.tradingIntervals).forEach(interval => {
                    clearInterval(interval);
                });
            }

            // Remove active data styling
            const marketData = document.getElementById('marketData');
            if (marketData) {
                marketData.classList.remove('active-data');
            }
        }

        // Function to update trading status in the database
        function updateTradingStatus(status) {
            // Create a hidden form
            const form = document.createElement('form');
            form.method = 'POST';
            form.style.display = 'none';

            // Add status input
            const statusInput = document.createElement('input');
            statusInput.type = 'hidden';
            statusInput.name = 'update_status';
            statusInput.value = '1';
            form.appendChild(statusInput);

            // Add status value
            const valueInput = document.createElement('input');
            valueInput.type = 'hidden';
            valueInput.name = 'status';
            valueInput.value = status ? '1' : '0';
            form.appendChild(valueInput);

            // Add form to document and submit
            document.body.appendChild(form);
            form.submit();
        }

        // Initialize UI based on current status
        updateTradingUI();

        if (activationButton && statusIndicator && statusText && sessionTimeValue) {
            activationButton.addEventListener('click', () => {
                // Only allow activation if currently inactive
                if (!tradingActive) {
                    // Update database - this will reload the page
                    updateTradingStatus(true);
                }
            });
        }

        // Add CSS for activation message
        const messageStyle = document.createElement('style');
        messageStyle.textContent = `
            .activation-message {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(14, 203, 129, 0.9);
                color: white;
                padding: 20px 40px;
                border-radius: 30px;
                font-weight: 600;
                font-size: 18px;
                box-shadow: 0 0 30px rgba(14, 203, 129, 0.7);
                z-index: 9999;
                opacity: 1;
                transition: opacity 0.5s ease;
            }

            .active-data {
                border-color: rgba(14, 203, 129, 0.3);
                box-shadow: 0 0 20px rgba(14, 203, 129, 0.2);
            }
        `;
        document.head.appendChild(messageStyle);

        // Function to update order book with real data
        async function updateOrderBook() {
            const orderBookAsks = document.querySelector('.order-book-asks');
            const orderBookBids = document.querySelector('.order-book-bids');
            if (!orderBookAsks || !orderBookBids) return;

            try {
                // Use the current base price from API
                const basePrice = currentBasePrice;

                // Clear existing order book data
                orderBookAsks.innerHTML = '';
                orderBookBids.innerHTML = '';

                // Generate asks (sell orders) based on real price
                for (let i = 0; i < 15; i++) {
                    // Calculate price with increasing spread for higher asks
                    const spreadFactor = 1 + (i * 0.0001); // Increasing spread
                    const price = basePrice * spreadFactor;
                    // More realistic volume distribution (higher volume near market price)
                    const volumeFactor = Math.max(0.1, 1 - (i * 0.05));
                    const amount = (Math.random() * 2 * volumeFactor).toFixed(4);
                    const total = (price * parseFloat(amount)).toFixed(4);
                    const depth = Math.max(5, 100 - (i * 6)); // Ensure minimum depth of 5%

                    const row = document.createElement('div');
                    row.className = 'order-book-row';
                    row.innerHTML = `
                        <div class="order-book-price">${price.toFixed(2)}</div>
                        <div class="order-book-amount">${amount}</div>
                        <div class="order-book-total">${total}</div>
                        <div class="order-book-depth ask-depth" style="width: ${depth}%"></div>
                    `;
                    orderBookAsks.appendChild(row);
                }

                // Generate bids (buy orders) based on real price
                for (let i = 0; i < 15; i++) {
                    // Calculate price with increasing spread for lower bids
                    const spreadFactor = 1 - (i * 0.0001); // Increasing spread
                    const price = basePrice * spreadFactor;
                    // More realistic volume distribution (higher volume near market price)
                    const volumeFactor = Math.max(0.1, 1 - (i * 0.05));
                    const amount = (Math.random() * 2 * volumeFactor).toFixed(4);
                    const total = (price * parseFloat(amount)).toFixed(4);
                    const depth = Math.max(5, 100 - (i * 6)); // Ensure minimum depth of 5%

                    const row = document.createElement('div');
                    row.className = 'order-book-row';
                    row.innerHTML = `
                        <div class="order-book-price">${price.toFixed(2)}</div>
                        <div class="order-book-amount">${amount}</div>
                        <div class="order-book-total">${total}</div>
                        <div class="order-book-depth bid-depth" style="width: ${depth}%"></div>
                    `;
                    orderBookBids.appendChild(row);
                }
            } catch (error) {
                console.error('Error updating order book:', error);
            }
        }

        // Initial order book update
        updateOrderBook();

        // Update order book periodically
        setInterval(updateOrderBook, 5000);
    } catch (error) {
        console.error('Error initializing trading interface:', error);
    }
});
</script>

<?php include_once 'footer.php'; ?>

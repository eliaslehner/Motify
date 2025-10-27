
<div align="center">

[//]: # "Add your logo here if available"
![Logo](public/bannerMotify_white.svg)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Other Repositories](#repositories)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Pages & Routes](#pages--routes)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Blockchain Interaction](#blockchain-interaction)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Motify is a decentralized application (dApp) designed to motivate users to achieve personal goals and maintain healthy habits through the creation and participation in blockchain-verified challenges. By combining the power of smart contracts for transparent, trustless execution and integration with external APIs for activity tracking, Motify ensures accountability and provides a gamified experience for goal achievement.

This repository contains the React-based frontend application, built as a Base Mini App, providing a user-friendly interface to interact with the Motify ecosystem.

---

## Other Repositories

These are the other repositories associated with Motify. 

- [Contracts](https://github.com/etaaa/motify-smart-contracts): This is the repository for the challenge and token contracts on the Base (L2 Ethereum).
- Backend: The backend is temporarily private while we complete a security review. It handles OAuth token exchange and user API tokens, so we’re ensuring no secrets or sensitive configs are exposed. We’ll publish a sanitized version shortly.

---

## Features

- **Challenge Creation**: Users can create challenges with specific goals (e.g., steps, coding time, social media activity), set start/end dates, define stakes (using USDC), and choose activity types.
- **Challenge Participation**: Join existing challenges that align with your goals.
- **API Integration**: Tracks progress using data from external services like GitHub, Farcaster, and WakaTime.
- **Staking & Incentives**: Participants stake USDC, which is pooled. Successful participants share the pool; unsuccessful participants may lose their stake (potentially donated to charity).
- **Real-time Updates**: View live progress and status of challenges using blockchain and API data.
- **Responsive Design**: Optimized for use within the Farcaster Mini App environment and standard web browsers.
- **Theming**: Dark mode support for a comfortable user experience.
- **User Profile**: Manage API connections and view personal stats (challenges participated, success rate, etc.).

---

## Tech Stack

- **Framework**: [React](https://reactjs.org/)
- **Router**: [React Router DOM](https://reactrouter.com/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Web3 Provider**: [Wagmi](https://wagmi.sh/) (for wallet interactions and contract calls)
- **Ethereum Library**: [Viem](https://viem.sh/)
- **Farcaster Integration**: [@farcaster/miniapp-sdk](https://docs.farcaster.xyz/)
- **Type Safety**: [TypeScript](https://www.typescriptlang.org/)

---

## Pages & Routes

The frontend application consists of several key pages, each serving a specific purpose within the Motify ecosystem:

- **`/` (Landing)**: The entry point for users, providing an overview of Motify's purpose and a sign-in option via Base.
- **`/home`**: Displays challenges the currently authenticated user is participating in.
- **`/discover`**: Allows users to browse all available challenges, filter them by status (active, upcoming, completed) or participation (all, not participating), and sort them (ending soon, most popular, newest).
- **`/create`**: Provides a form for users to create new challenges, specifying details like name, description, goal, duration, stake amount, activity type (GitHub, Farcaster, WakaTime), and privacy settings.
- **`/challenge/:id`**: Shows detailed information about a specific challenge, including its goal, duration, participants, progress, and a mechanism to join if eligible.
- **`/profile`**: Displays the user's profile information (Farcaster details), manages API integrations (GitHub, Farcaster, WakaTime), shows user statistics fetched from the backend, and displays the user's Motify token balance.
- **`/oauth/callback`**: Handles OAuth results from external services (like GitHub) after the user authorizes Motify access.
- **`*` (Not Found)**: A generic 404 page for invalid routes.

---

## Installation

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-username/motify-frontend.git
    cd motify-frontend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

---

## Configuration

1.  **Environment Variables:**
    Create a `.env` file in the project root (`.env.local` for Vite) and add the following variables:

    ```env
    # URL of the backend API server
    VITE_STATS_API_URL=https://your-motify-backend-url.com
    ```

    *Note: Ensure the backend API URL (`VITE_STATS_API_URL`) points to your running [Motify Backend](https://github.com/your-username/motify-backend) instance.*

---

## Usage

1.  **Start the Development Server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

2.  **Access the Application:**
    Open your browser and navigate to the URL provided by the development server.

---

## API Integration

The frontend communicates with the Motify Backend to manage user API integrations (GitHub, WakaTime), fetch user statistics, and retrieve challenge details. It uses the `ApiService` and dedicated service files (e.g., `githubService`, `wakatimeService`) for these interactions.

---

## Blockchain Interaction

Smart contract interactions (e.g., creating challenges, joining challenges, reading balances) are handled using the Wagmi library, configured via `OnchainProviders`.

---

## License

This project is licensed under the MIT License

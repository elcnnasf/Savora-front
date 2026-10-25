# Savora — Frontend

Savora is an AI-powered cooking assistant that helps users discover recipes based on the ingredients they have available. It combines ingredient management, recipe generation, and conversational AI in a single interface.

The frontend provides the user-facing experience for exploring recipes, managing ingredients, and customizing meals through AI-powered interactions.

## Features

### Ingredient Management

* Add ingredients manually.
* Manage available ingredients.
* Generate recipe suggestions based on selected ingredients.
* Upload ingredient photos for image-based recognition.

### AI-Powered Recipe Generation

* Generate recipes based on available ingredients.
* Display recipe ingredients and quantities.
* Provide step-by-step cooking instructions.
* Suggest ingredient alternatives.
* Adapt recipes to user preferences.

### AI Cooking Assistant

Users can interact with the AI assistant to modify recipes and get cooking advice.

Examples of supported requests include:

* Replacing unavailable ingredients.
* Adjusting recipes to personal preferences.
* Simplifying cooking instructions.
* Exploring alternative meals.
* Asking follow-up questions about recipes.

### Recipe Management

* Browse generated recipes.
* View detailed recipe information.
* Save and revisit recipes, where supported.
* Customize recipes through AI-assisted interactions.

### User Experience

* Clean and minimal interface.
* Light and dark themes.
* Multilingual interface.
* Responsive layouts for supported screen sizes.
* Ingredient-focused recipe discovery.

### Localization

The application is designed to support three languages:

* Azerbaijani
* English
* Russian

## Tech Stack

| Technology         | Purpose                                                |
| ------------------ | ------------------------------------------------------ |
| TypeScript         | Application development                                |
| React              | User interface, if used in the project                 |
| CSS / Tailwind CSS | Styling, depending on the implementation               |
| REST API           | Communication with backend services, where implemented |

## Application Flow

```text
User
  |
  v
Ingredient Selection
  |
  +-- Manual Input
  |
  +-- Photo Upload
  |
  v
Ingredient Processing
  |
  v
AI Recipe Generation
  |
  v
Recipe Results
  |
  +-- View Recipe Details
  |
  +-- Customize Recipe
  |
  +-- Ask AI Assistant
  |
  +-- Save Recipe
```

## Project Structure

The following is an illustrative structure. The actual repository may use a different organization.

```text
Savora-front/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── hooks/
│   ├── utils/
│   └── ...
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
```

## Getting Started

### Prerequisites

* Node.js
* npm
* Access to the required backend services

### Installation

Clone the repository:

```bash
git clone https://github.com/elcnnasf/Savora-front.git
```

Navigate to the project directory:

```bash
cd Savora-front
```

Install dependencies:

```bash
npm install
```

### Environment Configuration

Create a `.env` file in the project root and configure the environment variables required by the application.

Example for a Vite-based application:

```env
VITE_API_URL=
```

Add other variables only if they are required by the project.

Do not commit environment files containing sensitive credentials. Private AI API keys and server-side secrets should remain on the backend.

### Run Locally

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### Production Build

Build the application:

```bash
npm run build
```

If the project supports Vite's preview command, preview the production build with:

```bash
npm run preview
```

## Backend Integration

The frontend connects to backend services to support recipe-related functionality.

Depending on the implementation, these services may handle:

* AI recipe generation.
* Ingredient processing.
* Image-based ingredient recognition.
* Conversational recipe customization.
* Authentication and user data.
* Recipe storage and retrieval.

Private AI credentials should be handled by the backend rather than exposed in the frontend.

## Development

The project uses TypeScript for application development.

Before contributing, review the existing project structure, scripts, and coding conventions. Use the commands defined in `package.json` for development, building, and testing.

## Project Status

**Status:** In Development

Savora is being developed to make everyday cooking easier through ingredient-based recipe discovery and AI-assisted cooking guidance.

## License

No license has been specified in this README. Refer to the repository's license file for usage and distribution permissions.

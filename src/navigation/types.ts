export interface RecipeTranslation {
  title: string;
  description?: string;
  ingredients: { name: string; amount: string }[];
  steps: { step: number; instruction: string; duration?: string | number | null }[];
  tips?: string[];
  substitutions?: { ingredient: string; substitute: string; note?: string }[];
  storage?: string;
}

// Shared recipe type for AI-generated recipes passed between screens
export interface ApiRecipe {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
  estimated_cost?: number;
  cook_time: number;
  prep_time?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  tags: string[];
  allergens?: string[];
  ingredients: { name: string; amount: string }[];
  steps: { step: number; instruction: string; duration?: string | number }[];
  is_ai_generated?: boolean;
  rating_avg?: number | null;
  rating_count?: number;
  translations?: Record<string, RecipeTranslation>;
  imageSearchQuery?: string;
}

export type RootStackParamList = {
  Auth: undefined;
  OnboardingIntro: undefined;
  Main: undefined;
  RecipeDetail: { recipeId?: string; recipe?: ApiRecipe };
  AIRecipe: { ingredients?: string[]; initialDescription?: string } | undefined;
  CookingMode: {
    recipeId: string;
    recipeName?: string;
    steps?: { step: number; instruction: string; duration?: number }[];
  };
  MealPlanner: undefined;
  ShoppingList: undefined;
  Scan: undefined;
  MatchedRecipes: { ingredients: string[] };
  TastePreferences: undefined;
  MyProgress: undefined;
  Achievements: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  Premium: undefined;
  ManagePlan: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  AdminPanel: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
  VerifyEmail: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  AIChat: undefined;
  Saved: undefined;
  Profile: undefined;
};

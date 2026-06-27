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
  cook_time: number;
  prep_time?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  tags: string[];
  ingredients: { name: string; amount: string }[];
  steps: { step: number; instruction: string; duration?: number }[];
  is_ai_generated?: boolean;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  RecipeDetail: { recipeId?: string; recipe?: ApiRecipe };
  AIRecipe: undefined;
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
  MealGoals: undefined;
  MyProgress: undefined;
  Achievements: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  Premium: undefined;
  ManagePlan: undefined;
  SignIn: undefined;
  SignUp: undefined;
};

export type AuthStackParamList = {
  Onboarding: undefined;
  SignIn: undefined;
  SignUp: undefined;
  VerifyEmail: { email: string };
};

export type MainTabParamList = {
  Home: undefined;
  Discover: undefined;
  AIChat: undefined;
  Saved: undefined;
  Profile: undefined;
};

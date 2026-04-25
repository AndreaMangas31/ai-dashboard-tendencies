import { Category } from "@/lib/api/types";
import React from "react";

interface CategoryFilterProps {
  selectedCategory: Category;
  setSelectedCategory: React.Dispatch<React.SetStateAction<Category>>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  setSelectedCategory,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {(["all", "ai", "web", "tools"] as Category[]).map((category) => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category)}
          className={`
                px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap
                transition-all duration-200
                ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }
              `}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
};

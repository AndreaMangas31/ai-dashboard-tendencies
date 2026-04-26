import { Category, CategoryLabels } from "@/lib/api/types";
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
      {(Object.keys(CategoryLabels) as Category[]).map((category) => (
        <button
          key={category}
          onClick={() => setSelectedCategory(category)}
          className={`
                px-4 py-2 rounded-full font-medium text-sm whitespace-nowrap
                transition-all duration-200
                ${
                  selectedCategory === category
                    ? "bg-purple-500 text-white"
                    : "bg-tech-black-700 text-slate-300 hover:bg-purple-500/50"
                }
              `}
        >
          {category.charAt(0).toUpperCase() + category.slice(1)}
        </button>
      ))}
    </div>
  );
};

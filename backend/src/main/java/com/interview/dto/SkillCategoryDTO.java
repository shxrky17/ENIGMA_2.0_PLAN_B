package com.interview.dto;

import java.util.List;

public class SkillCategoryDTO {
    private String category;
    private String color;
    private List<String> skills;

    public SkillCategoryDTO() {
    }

    public SkillCategoryDTO(String category, String color, List<String> skills) {
        this.category = category;
        this.color = color;
        this.skills = skills;
    }

    public String getCategory() {
        return category;
    }

    public String getColor() {
        return color;
    }

    public List<String> getSkills() {
        return skills;
    }

    public void setCategory(String v) {
        this.category = v;
    }

    public void setColor(String v) {
        this.color = v;
    }

    public void setSkills(List<String> v) {
        this.skills = v;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final SkillCategoryDTO dto = new SkillCategoryDTO();

        public Builder category(String v) {
            dto.category = v;
            return this;
        }

        public Builder color(String v) {
            dto.color = v;
            return this;
        }

        public Builder skills(List<String> v) {
            dto.skills = v;
            return this;
        }

        public SkillCategoryDTO build() {
            return dto;
        }
    }
}

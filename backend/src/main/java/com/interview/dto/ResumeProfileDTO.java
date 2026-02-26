package com.interview.dto;

import java.util.List;

public class ResumeProfileDTO {
    private String name;
    private String experience;
    private String education;
    private List<SkillCategoryDTO> skillCategories;

    public ResumeProfileDTO() {
    }

    public ResumeProfileDTO(String name, String experience, String education, List<SkillCategoryDTO> skillCategories) {
        this.name = name;
        this.experience = experience;
        this.education = education;
        this.skillCategories = skillCategories;
    }

    public String getName() {
        return name;
    }

    public String getExperience() {
        return experience;
    }

    public String getEducation() {
        return education;
    }

    public List<SkillCategoryDTO> getSkillCategories() {
        return skillCategories;
    }

    public void setName(String v) {
        this.name = v;
    }

    public void setExperience(String v) {
        this.experience = v;
    }

    public void setEducation(String v) {
        this.education = v;
    }

    public void setSkillCategories(List<SkillCategoryDTO> v) {
        this.skillCategories = v;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private final ResumeProfileDTO dto = new ResumeProfileDTO();

        public Builder name(String v) {
            dto.name = v;
            return this;
        }

        public Builder experience(String v) {
            dto.experience = v;
            return this;
        }

        public Builder education(String v) {
            dto.education = v;
            return this;
        }

        public Builder skillCategories(List<SkillCategoryDTO> v) {
            dto.skillCategories = v;
            return this;
        }

        public ResumeProfileDTO build() {
            return dto;
        }
    }
}

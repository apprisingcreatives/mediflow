// AI Service for treatment predictions based on patient onboarding data
// This is a simplified implementation - in production, this would integrate with ML models

export interface PatientResponse {
  question_text: string;
  response_value: string | null;
  category: string | null;
}

export interface AIPredictionResult {
  predictionData: any;
  confidenceScore: number;
  recommendedTreatments: string[];
  riskFactors: string[];
  predictedConditions: string[];
}

export function analyzePatientData(
  responses: PatientResponse[]
): AIPredictionResult {
  const analysis: AIPredictionResult = {
    predictionData: {},
    confidenceScore: 0.0,
    recommendedTreatments: [],
    riskFactors: [],
    predictedConditions: [],
  };

  // Analyze responses for common patterns
  responses.forEach((response) => {
    const value = response.response_value?.toLowerCase() || "";

    if (response.category === "Medical History") {
      if (
        value.includes("diabetes") ||
        value.includes("high blood pressure") ||
        value.includes("hypertension")
      ) {
        analysis.riskFactors.push("Cardiovascular risk");
        analysis.recommendedTreatments.push(
          "Regular blood pressure monitoring"
        );
        analysis.recommendedTreatments.push("Blood glucose testing");
        analysis.recommendedTreatments.push("Cardiology consultation");
        analysis.predictedConditions.push("Potential hypertension or diabetes");
      }

      if (value.includes("allergy") || value.includes("allergies")) {
        analysis.riskFactors.push("Allergic conditions");
        analysis.recommendedTreatments.push("Allergy testing");
        analysis.recommendedTreatments.push("Immunology consultation");
      }

      if (
        value.includes("asthma") ||
        value.includes("breathing") ||
        value.includes("shortness of breath")
      ) {
        analysis.riskFactors.push("Respiratory conditions");
        analysis.recommendedTreatments.push("Pulmonary function testing");
        analysis.recommendedTreatments.push("Pulmonology consultation");
        analysis.predictedConditions.push(
          "Potential asthma or respiratory issues"
        );
      }

      if (
        value.includes("cancer") ||
        value.includes("tumor") ||
        value.includes("oncology")
      ) {
        analysis.riskFactors.push("Oncology concerns");
        analysis.recommendedTreatments.push("Oncology consultation");
        analysis.recommendedTreatments.push("Regular cancer screening");
      }

      if (
        value.includes("depression") ||
        value.includes("anxiety") ||
        value.includes("mental health")
      ) {
        analysis.riskFactors.push("Mental health concerns");
        analysis.recommendedTreatments.push("Mental health assessment");
        analysis.recommendedTreatments.push("Psychiatry consultation");
        analysis.recommendedTreatments.push("Counseling services");
      }
    }

    if (response.category === "Lifestyle") {
      if (
        value.includes("smoke") ||
        value.includes("smoking") ||
        value.includes("tobacco")
      ) {
        analysis.riskFactors.push("Smoking-related health risks");
        analysis.recommendedTreatments.push("Smoking cessation counseling");
        analysis.recommendedTreatments.push("Nicotine replacement therapy");
      }

      if (
        value.includes("exercise") &&
        (value.includes("never") || value.includes("rarely"))
      ) {
        analysis.riskFactors.push("Sedentary lifestyle");
        analysis.recommendedTreatments.push("Exercise prescription");
        analysis.recommendedTreatments.push("Physical therapy consultation");
      }

      if (
        value.includes("alcohol") &&
        (value.includes("heavy") || value.includes("daily"))
      ) {
        analysis.riskFactors.push("Alcohol-related health risks");
        analysis.recommendedTreatments.push("Substance abuse counseling");
      }
    }

    if (response.category === "Current Symptoms") {
      if (
        value.includes("pain") ||
        value.includes("ache") ||
        value.includes("hurt")
      ) {
        analysis.recommendedTreatments.push("Pain management consultation");
        analysis.recommendedTreatments.push("Physical therapy evaluation");
      }

      if (value.includes("fever") || value.includes("temperature")) {
        analysis.recommendedTreatments.push("Infectious disease evaluation");
      }

      if (
        value.includes("fatigue") ||
        value.includes("tired") ||
        value.includes("exhausted")
      ) {
        analysis.recommendedTreatments.push("Comprehensive blood work");
        analysis.recommendedTreatments.push("Endocrinology consultation");
      }
    }
  });

  // Remove duplicates
  analysis.recommendedTreatments = [...new Set(analysis.recommendedTreatments)];
  analysis.riskFactors = [...new Set(analysis.riskFactors)];
  analysis.predictedConditions = [...new Set(analysis.predictedConditions)];

  // Calculate confidence score based on available data
  analysis.confidenceScore = Math.min(
    0.9,
    responses.length * 0.1 + analysis.riskFactors.length * 0.1
  );

  // Add general recommendations if no specific issues found
  if (analysis.recommendedTreatments.length === 0) {
    analysis.recommendedTreatments.push("Annual physical examination");
    analysis.recommendedTreatments.push("Basic blood work panel");
    analysis.recommendedTreatments.push("Preventive health screening");
  }

  return analysis;
}

export function generateTreatmentPlan(prediction: AIPredictionResult): any {
  return {
    immediateActions: [
      "Schedule comprehensive health assessment",
      "Review and update medical history",
      "Discuss lifestyle modifications",
    ],
    recommendedSpecialists: prediction.predictedConditions.map((condition) => {
      if (
        condition.includes("cardiovascular") ||
        condition.includes("hypertension")
      ) {
        return "Cardiologist";
      }
      if (condition.includes("diabetes")) {
        return "Endocrinologist";
      }
      if (condition.includes("respiratory") || condition.includes("asthma")) {
        return "Pulmonologist";
      }
      if (condition.includes("allergy")) {
        return "Allergist";
      }
      if (condition.includes("mental")) {
        return "Psychiatrist";
      }
      return "Primary Care Physician";
    }),
    monitoringSchedule: [
      "Monthly vital signs check",
      "Quarterly comprehensive blood work",
      "Annual specialist consultations",
    ],
    lifestyleRecommendations: [
      "Maintain healthy diet",
      "Regular exercise routine",
      "Adequate sleep (7-9 hours nightly)",
      "Stress management techniques",
    ],
  };
}

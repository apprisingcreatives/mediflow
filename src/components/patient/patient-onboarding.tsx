"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import {
  PatientOnboardingData,
  ClinicOnboardingQuestion,
  ClinicRequiredDocument,
} from "@/types/database";
import { supabase } from "@/lib/supabase";

interface PatientOnboardingProps {
  clinicId: string;
  patientId: string;
  onComplete?: () => void;
}

export default function PatientOnboarding({
  clinicId,
  patientId,
  onComplete,
}: PatientOnboardingProps) {
  const [onboardingData, setOnboardingData] =
    useState<PatientOnboardingData | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [matchedPractitioner, setMatchedPractitioner] = useState<{
    id: string;
    name: string;
    specialization: string;
  } | null>(null);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return {};
    return { Authorization: `Bearer ${session.access_token}` };
  };

  useEffect(() => {
    fetchOnboardingData();
  }, [clinicId, patientId]);

  const fetchOnboardingData = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/clinic/${clinicId}/patients/${patientId}/onboarding`,
        { headers }
      );
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);

        // Initialize responses from existing data
        const initialResponses: Record<string, any> = {};
        data.responses?.forEach((response: any) => {
          initialResponses[response.question_id] = {
            value: response.response_value,
            options: response.response_options,
          };
        });
        setResponses(initialResponses);

        calculateProgress(
          data.questions || [],
          data.documents || [],
          initialResponses,
          data.uploadedDocuments || []
        );
      }
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (
    questions: ClinicOnboardingQuestion[],
    documents: ClinicRequiredDocument[],
    currentResponses: Record<string, any>,
    uploadedDocs: any[]
  ) => {
    const totalItems = questions.length + documents.length;
    if (totalItems === 0) {
      setProgress(100);
      return;
    }

    let completedItems = 0;

    // Count completed questions
    questions.forEach((question) => {
      if (currentResponses[question.id]?.value) {
        completedItems++;
      }
    });

    // Count uploaded documents (at least one per required document type)
    const uploadedCount = Math.min(uploadedDocs.length, documents.length);
    completedItems += uploadedCount;

    setProgress((completedItems / totalItems) * 100);
  };

  const handleResponseChange = (
    questionId: string,
    value: any,
    options?: any[]
  ) => {
    const newResponses = {
      ...responses,
      [questionId]: { value, options },
    };
    setResponses(newResponses);

    if (onboardingData) {
      calculateProgress(
        onboardingData.questions,
        onboardingData.documents,
        newResponses,
        onboardingData.uploadedDocuments || []
      );
    }
  };

  const handleFileUpload = async (documentTypeId: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [documentTypeId]: file }));

    const formData = new FormData();
    formData.append("documentTypeId", documentTypeId);
    formData.append("file", file);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/clinic/${clinicId}/patients/${patientId}/documents`,
        {
          method: "POST",
          headers,
          body: formData,
        }
      );

      if (response.ok) {
        // Refresh onboarding data to show uploaded document
        fetchOnboardingData();
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const responseData = Object.entries(responses).map(
        ([questionId, response]) => ({
          questionId,
          value: response.value,
          options: response.options,
        })
      );

      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/clinic/${clinicId}/patients/${patientId}/onboarding`,
        {
          method: "POST",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({
            responses: responseData,
            completeOnboarding: true,
          }),
        }
      );

      if (response.ok) {
        onComplete?.();
      }
    } catch (error) {
      console.error("Error submitting onboarding:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(
        `/api/clinic/${clinicId}/patients/${patientId}/onboarding/analyze`,
        { method: "POST", headers }
      );
      if (response.ok) {
        const data = await response.json();
        setOnboardingData((prev) =>
          prev ? { ...prev, aiPrediction: data.prediction } : prev
        );
        setMatchedPractitioner(data.matchedPractitioner);
      }
    } catch (error) {
      console.error("Error analyzing health data:", error);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderQuestion = (question: ClinicOnboardingQuestion) => {
    const response = responses[question.id];

    switch (question.question_type) {
      case "text":
        return (
          <Input
            value={response?.value || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer"
          />
        );

      case "textarea":
        return (
          <Textarea
            value={response?.value || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            rows={3}
          />
        );

      case "select":
        return (
          <Select
            value={response?.value || ""}
            onValueChange={(value) => handleResponseChange(question.id, value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {question.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "multiselect":
        return (
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${option}`}
                  checked={response?.options?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentOptions = response?.options || [];
                    const newOptions = checked
                      ? [...currentOptions, option]
                      : currentOptions.filter((o: string) => o !== option);
                    handleResponseChange(question.id, null, newOptions);
                  }}
                />
                <Label htmlFor={`${question.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case "yesno":
        return (
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-yes`}
                checked={response?.value === "yes"}
                onCheckedChange={(checked) =>
                  handleResponseChange(question.id, checked ? "yes" : "")
                }
              />
              <Label htmlFor={`${question.id}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-no`}
                checked={response?.value === "no"}
                onCheckedChange={(checked) =>
                  handleResponseChange(question.id, checked ? "no" : "")
                }
              />
              <Label htmlFor={`${question.id}-no`}>No</Label>
            </div>
          </div>
        );

      case "number":
        return (
          <Input
            type="number"
            value={response?.value || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter a number"
          />
        );

      case "date":
        return (
          <Input
            type="date"
            value={response?.value || ""}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading onboarding...</div>;
  }

  if (!onboardingData) {
    return (
      <div className="text-center p-8">Failed to load onboarding data</div>
    );
  }

  const { questions, documents, uploadedDocuments, aiPrediction } =
    onboardingData;
  const isComplete = progress === 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Complete Your Health Profile</h1>
        <p className="text-muted-foreground mt-2">
          Please answer the following questions and upload required documents
        </p>
        <div className="mt-4">
          <Progress value={progress} className="w-full max-w-md mx-auto" />
          <p className="text-sm text-muted-foreground mt-2">
            {Math.round(progress)}% complete
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Questions Section */}
        {questions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Health History Questions</CardTitle>
              <CardDescription>
                Please answer all questions accurately to help us provide better
                care
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {questions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <Label className="text-base font-medium">
                    {question.question_text}
                    {question.is_required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </Label>
                  {question.category && (
                    <Badge variant="outline" className="text-xs">
                      {question.category}
                    </Badge>
                  )}
                  {renderQuestion(question)}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Documents Section */}
        {documents.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Required Documents</CardTitle>
              <CardDescription>
                Please upload the following documents to complete your profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {documents.map((document) => {
                const uploadedDoc = uploadedDocuments?.find(
                  (doc) => doc.description === document.document_name
                );

                return (
                  <div
                    key={document.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{document.document_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {document.document_description}
                        </p>
                        <div className="flex gap-2 mt-1">
                          {document.is_required && (
                            <Badge variant="secondary">Required</Badge>
                          )}
                          {document.allowed_file_types && (
                            <Badge variant="outline">
                              Types: {document.allowed_file_types}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {uploadedDoc ? (
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm">Uploaded</span>
                        </div>
                      ) : (
                        <div>
                          <Input
                            type="file"
                            accept={
                              document.allowed_file_types
                                ? `.${document.allowed_file_types.split(",").join(",.")}`
                                : undefined
                            }
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(document.id, file);
                            }}
                            className="hidden"
                            id={`file-${document.id}`}
                          />
                          <Label
                            htmlFor={`file-${document.id}`}
                            className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90"
                          >
                            <Upload className="w-4 h-4" />
                            Upload
                          </Label>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        {/* AI Analysis Trigger */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              AI Health Assessment
            </CardTitle>
            <CardDescription>
              Based on your responses, here are our AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!aiPrediction && !analyzing && (
              <Button onClick={handleAnalyze} disabled={progress < 50}>
                {progress < 50
                  ? "Complete more questions to enable analysis"
                  : "Analyze My Health Profile"}
              </Button>
            )}

            {analyzing && (
              <div className="flex items-center gap-3 py-4">
                <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm text-muted-foreground">
                  Analyzing your health profile... This may take a moment.
                </p>
              </div>
            )}

            {aiPrediction && (
              <>
                {aiPrediction.recommended_treatments && (
                  <div>
                    <h4 className="font-medium mb-2">Recommended Treatments:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiPrediction.recommended_treatments.map(
                        (treatment: string, index: number) => (
                          <li key={index} className="text-sm">
                            {treatment}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {aiPrediction.risk_factors &&
                  aiPrediction.risk_factors.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">
                        Identified Risk Factors:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {aiPrediction.risk_factors.map(
                          (risk: string, index: number) => (
                            <Badge key={index} variant="destructive">
                              {risk}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>
                  )}

                <div className="text-sm text-muted-foreground">
                  Confidence Score:{" "}
                  {Math.round((aiPrediction.confidence_score || 0) * 100)}%
                </div>
              </>
            )}

            {matchedPractitioner && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <p className="font-medium mb-2">
                  We recommend booking with {matchedPractitioner.name} ({matchedPractitioner.specialization})
                </p>
                <a
                  href={`/book?clinic=${clinicId}&practitionerId=${matchedPractitioner.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Book Appointment
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-center">
        <Button
          onClick={handleSubmit}
          disabled={!isComplete || submitting}
          size="lg"
          className="px-8"
        >
          {submitting ? "Completing..." : "Complete Onboarding"}
        </Button>
      </div>
    </div>
  );
}

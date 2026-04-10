"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import {
  ClinicOnboardingQuestion,
  ClinicRequiredDocument,
} from "@/types/database";

interface OnboardingManagementProps {
  clinicId: string;
}

export default function OnboardingManagement({
  clinicId,
}: OnboardingManagementProps) {
  const [questions, setQuestions] = useState<ClinicOnboardingQuestion[]>([]);
  const [documents, setDocuments] = useState<ClinicRequiredDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchOnboardingData();
  }, [clinicId]);

  const fetchOnboardingData = async () => {
    try {
      const [questionsRes, documentsRes] = await Promise.all([
        fetch(`/api/clinic/${clinicId}/onboarding/questions`),
        fetch(`/api/clinic/${clinicId}/onboarding/documents`),
      ]);

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(questionsData.questions);
      }

      if (documentsRes.ok) {
        const documentsData = await documentsRes.json();
        setDocuments(documentsData.documents);
      }
    } catch (error) {
      console.error("Error fetching onboarding data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadTemplate = async () => {
    setLoadingTemplate(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(
        `/api/clinic/${clinicId}/onboarding/questions/load-template`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );
      if (response.ok) {
        fetchOnboardingData();
      } else {
        const data = await response.json();
        console.error("Error loading template:", data.error);
      }
    } catch (error) {
      console.error("Error loading template:", error);
    } finally {
      setLoadingTemplate(false);
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;

    try {
      const response = await fetch(
        `/api/clinic/${clinicId}/onboarding/questions/${questionId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setQuestions(questions.filter((q) => q.id !== questionId));
      }
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const deleteDocument = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document requirement?"))
      return;

    try {
      const response = await fetch(
        `/api/clinic/${clinicId}/onboarding/documents/${documentId}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setDocuments(documents.filter((d) => d.id !== documentId));
      }
    } catch (error) {
      console.error("Error deleting document:", error);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Patient Onboarding Management</h1>
          <p className="text-muted-foreground">
            Configure health history questions and required documents for
            patient onboarding
          </p>
        </div>
      </div>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions">Health Questions</TabsTrigger>
          <TabsTrigger value="documents">Required Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Health History Questions</h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadTemplate}
                disabled={loadingTemplate || questions.length > 0}
              >
                {loadingTemplate ? "Loading..." : "Load Template"}
              </Button>
              <Button
                onClick={() =>
                  router.push(`/clinic/dashboard/onboarding/questions/new`)
                }
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {questions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No questions configured yet
                  </p>
                  <Button
                    onClick={() =>
                      router.push(`/clinic/dashboard/onboarding/questions/new`)
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Question
                  </Button>
                </CardContent>
              </Card>
            ) : (
              questions.map((question) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {question.question_text}
                        </CardTitle>
                        <CardDescription>
                          Type: {question.question_type} • Category:{" "}
                          {question.category || "General"}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        {question.is_required && (
                          <Badge variant="secondary">Required</Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/clinic/dashboard/onboarding/questions/${question.id}`
                            )
                          }
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Required Documents</h2>
            <Button
              onClick={() =>
                router.push(`/clinic/dashboard/onboarding/documents/new`)
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Document
            </Button>
          </div>

          <div className="grid gap-4">
            {documents.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">
                    No document requirements configured yet
                  </p>
                  <Button
                    onClick={() =>
                      router.push(`/clinic/dashboard/onboarding/documents/new`)
                    }
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Document
                  </Button>
                </CardContent>
              </Card>
            ) : (
              documents.map((document) => (
                <Card key={document.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {document.document_name}
                        </CardTitle>
                        <CardDescription>
                          {document.document_description}
                        </CardDescription>
                        <div className="flex items-center gap-2 mt-2">
                          {document.is_required && (
                            <Badge variant="secondary">Required</Badge>
                          )}
                          {document.allowed_file_types && (
                            <Badge variant="outline">
                              Types: {document.allowed_file_types}
                            </Badge>
                          )}
                          <Badge variant="outline">
                            Max: {document.max_file_size_mb}MB
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            router.push(
                              `/clinic/dashboard/onboarding/documents/${document.id}`
                            )
                          }
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteDocument(document.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

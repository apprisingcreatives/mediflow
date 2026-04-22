'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  X,
  Paperclip,
  Save,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Brain,
  Send,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PatientOnboardingData,
  ClinicOnboardingQuestion,
  ClinicRequiredDocument,
} from '@/types/database';
import { supabase } from '@/lib/supabase';

interface PatientOnboardingProps {
  clinicId: string;
  patientId: string;
  appointmentId?: string;
  onComplete?: () => void;
}

interface Step {
  id: string;
  label: string;
  icon: React.ReactNode;
}

export default function PatientOnboarding({
  clinicId,
  patientId,
  appointmentId,
  onComplete,
}: PatientOnboardingProps) {
  const router = useRouter();
  const [onboardingData, setOnboardingData] =
    useState<PatientOnboardingData | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [linkedDocuments, setLinkedDocuments] = useState<
    Record<string, string>
  >({});
  const [showExistingPicker, setShowExistingPicker] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [progress, setProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [matchedPractitioner, setMatchedPractitioner] = useState<{
    id: string;
    name: string;
    specialization: string;
  } | null>(null);

  const getAuthHeaders = async (): Promise<Record<string, string>> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) return {};
    return { Authorization: `Bearer ${session.access_token}` };
  };

  const dataUrl = appointmentId
    ? `/api/appointments/${appointmentId}/intake`
    : `/api/clinic/${clinicId}/patients/${patientId}/onboarding`;
  const documentsUrl = appointmentId
    ? `/api/appointments/${appointmentId}/intake/documents`
    : `/api/clinic/${clinicId}/patients/${patientId}/documents`;
  const analyzeUrl = `/api/clinic/${clinicId}/patients/${patientId}/onboarding/analyze`;

  // Build steps dynamically based on available data
  const steps: Step[] = useMemo(() => {
    if (!onboardingData) return [];
    const s: Step[] = [];
    if (onboardingData.questions.length > 0) {
      s.push({
        id: 'questions',
        label: 'Health Questions',
        icon: <ClipboardList className="w-4 h-4" />,
      });
    }
    if (onboardingData.documents.length > 0) {
      s.push({
        id: 'documents',
        label: 'Documents',
        icon: <FileText className="w-4 h-4" />,
      });
    }
    s.push({
      id: 'ai',
      label: 'AI Assessment',
      icon: <Brain className="w-4 h-4" />,
    });
    s.push({
      id: 'review',
      label: 'Review & Submit',
      icon: <Send className="w-4 h-4" />,
    });
    return s;
  }, [onboardingData]);

  useEffect(() => {
    fetchOnboardingData();
  }, [clinicId, patientId]);

  const fetchOnboardingData = async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(dataUrl, { headers });
      if (response.ok) {
        const data = await response.json();
        setOnboardingData(data);

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
          data.uploadedDocuments || [],
        );
      }
    } catch (error) {
      console.error('Error fetching onboarding data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProgress = (
    questions: ClinicOnboardingQuestion[],
    requiredDocs: ClinicRequiredDocument[],
    currentResponses: Record<string, any>,
    uploadedDocs: any[],
    currentLinkedDocs: Record<string, string> = linkedDocuments,
  ) => {
    const totalItems = questions.length + requiredDocs.length;
    if (totalItems === 0) {
      setProgress(100);
      return;
    }

    let completedItems = 0;

    questions.forEach((question) => {
      const r = currentResponses[question.id];
      if (r?.value || (r?.options && r.options.length > 0)) {
        completedItems++;
      }
    });

    requiredDocs.forEach((doc) => {
      const matchedByUpload = uploadedDocs.some(
        (u) => u.description === doc.document_name,
      );
      const matchedByLink = !!currentLinkedDocs[doc.id];
      if (matchedByUpload || matchedByLink) completedItems++;
    });

    setProgress((completedItems / totalItems) * 100);
  };

  const handleResponseChange = (
    questionId: string,
    value: any,
    options?: any[],
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
        onboardingData.uploadedDocuments || [],
      );
    }
  };

  const handleFileUpload = async (documentTypeId: string, file: File) => {
    setUploadedFiles((prev) => ({ ...prev, [documentTypeId]: file }));

    const formData = new FormData();
    formData.append('documentTypeId', documentTypeId);
    formData.append('file', file);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(documentsUrl, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingData((prev) => {
          if (!prev) return prev;
          const updatedDocs = [
            ...(prev.uploadedDocuments || []),
            data.document,
          ];
          calculateProgress(
            prev.questions,
            prev.documents,
            responses,
            updatedDocs,
          );
          return { ...prev, uploadedDocuments: updatedDocs };
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/patient-documents/${documentId}`, {
        method: 'DELETE',
        headers,
      });

      if (res.ok) {
        setOnboardingData((prev) => {
          if (!prev) return prev;
          const updatedDocs = (prev.uploadedDocuments || []).filter(
            (d: any) => d.id !== documentId,
          );
          calculateProgress(
            prev.questions,
            prev.documents,
            responses,
            updatedDocs,
          );
          return { ...prev, uploadedDocuments: updatedDocs };
        });
      }
    } catch (error) {
      console.error('Error removing document:', error);
    }
  };

  const handleLinkExistingDocument = (
    requiredDocId: string,
    existingDocId: string,
  ) => {
    const newLinkedDocs = { ...linkedDocuments, [requiredDocId]: existingDocId };
    setLinkedDocuments(newLinkedDocs);
    setShowExistingPicker(null);

    if (onboardingData) {
      calculateProgress(
        onboardingData.questions,
        onboardingData.documents,
        responses,
        onboardingData.uploadedDocuments || [],
        newLinkedDocs,
      );
    }
  };

  const handleUnlinkDocument = (requiredDocId: string) => {
    const newLinkedDocs = { ...linkedDocuments };
    delete newLinkedDocs[requiredDocId];
    setLinkedDocuments(newLinkedDocs);

    if (onboardingData) {
      calculateProgress(
        onboardingData.questions,
        onboardingData.documents,
        responses,
        onboardingData.uploadedDocuments || [],
        newLinkedDocs,
      );
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
        }),
      );

      const headers = await getAuthHeaders();
      const response = await fetch(dataUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: responseData,
          ...(appointmentId
            ? { completeIntake: true }
            : { completeOnboarding: true }),
        }),
      });

      if (response.ok) {
        toast.success('Intake completed successfully');
        onComplete?.();
      }
    } catch (error) {
      console.error('Error submitting onboarding:', error);
      toast.error('Failed to complete intake');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveForLater = async () => {
    const filledResponses = Object.entries(responses).filter(
      ([, r]) => r.value || r.options?.length,
    );
    if (filledResponses.length === 0) {
      toast.info('Nothing to save yet');
      return;
    }

    setSaving(true);
    try {
      const responseData = filledResponses.map(([questionId, response]) => ({
        questionId,
        value: response.value,
        options: response.options,
      }));

      const headers = await getAuthHeaders();
      const res = await fetch(dataUrl, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ responses: responseData }),
      });

      if (res.ok) {
        toast.success('Progress saved — you can come back anytime to finish');
        router.back();
      } else {
        toast.error('Failed to save progress');
      }
    } catch {
      toast.error('Failed to save progress');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(analyzeUrl, {
        method: 'POST',
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setOnboardingData((prev) =>
          prev ? { ...prev, aiPrediction: data.prediction } : prev,
        );
        setMatchedPractitioner(data.matchedPractitioner);
      }
    } catch (error) {
      console.error('Error analyzing health data:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  const renderQuestion = (question: ClinicOnboardingQuestion) => {
    const response = responses[question.id];

    switch (question.question_type) {
      case 'text':
        return (
          <Input
            value={response?.value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer"
          />
        );
      case 'textarea':
        return (
          <Textarea
            value={response?.value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter your answer"
            rows={3}
          />
        );
      case 'select':
        return (
          <Select
            value={response?.value || ''}
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
      case 'multiselect':
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
      case 'yesno':
        return (
          <div className="flex gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-yes`}
                checked={response?.value === 'yes'}
                onCheckedChange={(checked) =>
                  handleResponseChange(question.id, checked ? 'yes' : '')
                }
              />
              <Label htmlFor={`${question.id}-yes`}>Yes</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id={`${question.id}-no`}
                checked={response?.value === 'no'}
                onCheckedChange={(checked) =>
                  handleResponseChange(question.id, checked ? 'no' : '')
                }
              />
              <Label htmlFor={`${question.id}-no`}>No</Label>
            </div>
          </div>
        );
      case 'number':
        return (
          <Input
            type="number"
            value={response?.value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="Enter a number"
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={response?.value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
          />
        );
      default:
        return <div>Unsupported question type</div>;
    }
  };

  // --- Step content renderers ---

  const renderQuestionsStep = () => {
    const { questions } = onboardingData!;
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health History Questions</CardTitle>
          <CardDescription>
            Please answer all questions accurately to help us provide better care
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
    );
  };

  const renderDocumentsStep = () => {
    const { documents, uploadedDocuments } = onboardingData!;
    return (
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
              (doc) => doc.description === document.document_name,
            );
            const linkedDocId = linkedDocuments[document.id];
            const linkedDoc = linkedDocId
              ? uploadedDocuments?.find((d) => d.id === linkedDocId)
              : null;
            const fulfilled = uploadedDoc || linkedDoc;

            const alreadyLinkedIds = new Set(Object.values(linkedDocuments));
            const availableExistingDocs = (uploadedDocuments || []).filter(
              (d) => !alreadyLinkedIds.has(d.id) || d.id === linkedDocId,
            );

            return (
              <div key={document.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-muted-foreground shrink-0" />
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
                    {fulfilled ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                        <span className="text-sm text-green-700 dark:text-green-400 truncate max-w-[150px]">
                          {fulfilled.file_name || 'Uploaded'}
                        </span>
                        {linkedDoc ? (
                          <button
                            type="button"
                            onClick={() => handleUnlinkDocument(document.id)}
                            className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Unlink document"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleRemoveDocument(uploadedDoc!.id)}
                            className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-600 transition-colors"
                            title="Remove document"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          type="file"
                          accept={
                            document.allowed_file_types
                              ? `.${document.allowed_file_types.split(',').join(',.')}`
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
                          className="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md cursor-pointer hover:bg-primary/90 text-sm"
                        >
                          <Upload className="w-4 h-4" />
                          Upload
                        </Label>
                        {availableExistingDocs.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setShowExistingPicker(
                                showExistingPicker === document.id
                                  ? null
                                  : document.id,
                              )
                            }
                          >
                            <Paperclip className="w-4 h-4 mr-1" />
                            Use Existing
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {showExistingPicker === document.id && !fulfilled && (
                  <div className="ml-11 border rounded-md divide-y bg-muted/30">
                    <p className="px-3 py-2 text-xs font-medium text-muted-foreground">
                      Select from your existing documents:
                    </p>
                    {availableExistingDocs.map((existingDoc) => (
                      <button
                        key={existingDoc.id}
                        type="button"
                        onClick={() =>
                          handleLinkExistingDocument(document.id, existingDoc.id)
                        }
                        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors"
                      >
                        <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span className="truncate">{existingDoc.file_name}</span>
                        <span className="text-xs text-muted-foreground ml-auto shrink-0">
                          {existingDoc.description || 'Document'}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    );
  };

  const renderAIStep = () => {
    const aiPrediction = onboardingData!.aiPrediction;
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            AI Health Assessment
          </CardTitle>
          <CardDescription>
            Get AI-powered recommendations based on your responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!aiPrediction && !analyzing && (
            <div className="text-center py-6">
              <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">
                {progress < 50
                  ? 'Complete more questions to enable AI analysis'
                  : 'Ready to analyze your health profile'}
              </p>
              <Button onClick={handleAnalyze} disabled={progress < 50} size="lg">
                Analyze My Health Profile
              </Button>
            </div>
          )}

          {analyzing && (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-sm text-muted-foreground">
                Analyzing your health profile... This may take a moment.
              </p>
            </div>
          )}

          {aiPrediction && (
            <>
              {aiPrediction.recommended_specialty && (
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">Recommended Specialty:</h4>
                  <Badge variant="secondary" className="text-sm">
                    {aiPrediction.recommended_specialty}
                  </Badge>
                </div>
              )}

              {aiPrediction.predicted_conditions &&
                aiPrediction.predicted_conditions.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">
                      Conditions to Investigate:
                    </h4>
                    <ul className="list-disc list-inside space-y-1">
                      {aiPrediction.predicted_conditions.map(
                        (condition: string, index: number) => (
                          <li key={index} className="text-sm">
                            {condition}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                )}

              {aiPrediction.recommended_treatments && (
                <div>
                  <h4 className="font-medium mb-2">Recommended Treatments:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {aiPrediction.recommended_treatments.map(
                      (treatment: string, index: number) => (
                        <li key={index} className="text-sm">
                          {treatment}
                        </li>
                      ),
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
                        ),
                      )}
                    </div>
                  </div>
                )}

              <div className="text-sm text-muted-foreground">
                Confidence Score:{' '}
                {Math.round((aiPrediction.confidence_score || 0) * 100)}%
              </div>

              {matchedPractitioner && (
                <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                  <p className="font-medium mb-2">
                    We recommend booking with {matchedPractitioner.name} (
                    {matchedPractitioner.specialization})
                  </p>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderReviewStep = () => {
    const { questions, documents, uploadedDocuments } = onboardingData!;
    const answeredQuestions = questions.filter((q) => {
      const r = responses[q.id];
      return r?.value || (r?.options && r.options.length > 0);
    });
    const unansweredQuestions = questions.filter((q) => {
      const r = responses[q.id];
      return !r?.value && !(r?.options && r.options.length > 0);
    });

    const fulfilledDocs = documents.filter((doc) => {
      const matchedByUpload = (uploadedDocuments || []).some(
        (u) => u.description === doc.document_name,
      );
      return matchedByUpload || !!linkedDocuments[doc.id];
    });
    const missingDocs = documents.filter((doc) => {
      const matchedByUpload = (uploadedDocuments || []).some(
        (u) => u.description === doc.document_name,
      );
      return !matchedByUpload && !linkedDocuments[doc.id];
    });

    const isComplete = progress === 100;

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Review Your Submission</CardTitle>
            <CardDescription>
              Review your answers before submitting
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Questions summary */}
            {questions.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" />
                  Health Questions ({answeredQuestions.length}/{questions.length} answered)
                </h4>
                <div className="space-y-2">
                  {answeredQuestions.map((q) => {
                    const r = responses[q.id];
                    const displayValue = r?.options?.length
                      ? r.options.join(', ')
                      : r?.value || '';
                    return (
                      <div
                        key={q.id}
                        className="flex items-start gap-2 text-sm border-b border-border/50 pb-2"
                      >
                        <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-muted-foreground">{q.question_text}</p>
                          <p className="font-medium">{displayValue}</p>
                        </div>
                      </div>
                    );
                  })}
                  {unansweredQuestions.map((q) => (
                    <div
                      key={q.id}
                      className="flex items-start gap-2 text-sm border-b border-border/50 pb-2"
                    >
                      <X className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-muted-foreground">
                          {q.question_text}
                          {q.is_required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </p>
                        <p className="text-amber-600 text-xs">Not answered</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents summary */}
            {documents.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Documents ({fulfilledDocs.length}/{documents.length} uploaded)
                </h4>
                <div className="space-y-2">
                  {fulfilledDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                      <span>{doc.document_name}</span>
                    </div>
                  ))}
                  {missingDocs.map((doc) => (
                    <div key={doc.id} className="flex items-center gap-2 text-sm">
                      <X className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="text-muted-foreground">
                        {doc.document_name}
                        {doc.is_required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {!isComplete && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              Some required fields are incomplete. You can still save your progress
              and come back later, or go back to fill in the missing items.
            </p>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (!onboardingData || steps.length === 0) return null;
    const stepId = steps[currentStep]?.id;
    switch (stepId) {
      case 'questions':
        return renderQuestionsStep();
      case 'documents':
        return renderDocumentsStep();
      case 'ai':
        return renderAIStep();
      case 'review':
        return renderReviewStep();
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!onboardingData) {
    return (
      <div className="text-center p-8">Failed to load onboarding data</div>
    );
  }

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;
  const isComplete = progress === 100;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold">Complete Your Health Profile</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {Math.round(progress)}% complete
        </p>
      </div>

      {/* Stepper indicator */}
      <nav className="flex items-center justify-center gap-1">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          return (
            <div key={step.id} className="flex items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(index)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : isCompleted
                      ? 'bg-primary/10 text-primary hover:bg-primary/20'
                      : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                  isActive
                    ? 'bg-primary-foreground/20'
                    : isCompleted
                      ? 'bg-primary/20'
                      : 'bg-muted-foreground/20'
                }`}>
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="w-4 h-4 text-muted-foreground/40 mx-1" />
              )}
            </div>
          );
        })}
      </nav>

      {/* Step content */}
      {renderCurrentStep()}

      {/* Navigation */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {!isFirstStep && (
            <Button
              variant="ghost"
              onClick={() => setCurrentStep((s) => s - 1)}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleSaveForLater}
            disabled={saving || submitting}
          >
            {saving ? (
              <>
                <Save className="w-4 h-4 mr-2 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save &amp; Exit
              </>
            )}
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={!isComplete || submitting}
            >
              {submitting
                ? 'Completing...'
                : appointmentId
                  ? 'Complete Intake'
                  : 'Complete Onboarding'}
            </Button>
          ) : (
            <Button onClick={() => setCurrentStep((s) => s + 1)}>
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

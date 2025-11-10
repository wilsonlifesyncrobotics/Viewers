/**
 * StudyEnrollmentDialog Component
 * Dialog for enrolling studies into surgical cases
 * Allows selection of case and clinical phase
 */

import React, { useState, useEffect } from 'react';
import { Button, Icons } from '@ohif/ui-next';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@ohif/ui-next';
import { CLINICAL_PHASES, CLINICAL_PHASE_LABELS } from '../services/CaseService';
import type { CaseSummary } from '../services/CaseService';

interface StudyEnrollmentDialogProps {
  servicesManager: any;
  studyInstanceUID: string;
  studyData?: {
    patientName?: string;
    mrn?: string;
    studyDate?: string;
    modalities?: string[];
    description?: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

function StudyEnrollmentDialog({
  servicesManager,
  studyInstanceUID,
  studyData,
  onClose,
  onSuccess,
}: StudyEnrollmentDialogProps) {
  const [cases, setCases] = useState<CaseSummary[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [selectedPhase, setSelectedPhase] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showCreateCase, setShowCreateCase] = useState<boolean>(false);

  // Case creation fields
  const [newCaseMrn, setNewCaseMrn] = useState<string>(studyData?.mrn || '');
  const [newCaseName, setNewCaseName] = useState<string>(studyData?.patientName || '');

  const caseService = servicesManager?.services?.caseService;

  useEffect(() => {
    loadCases();
  }, []);

  const loadCases = async () => {
    if (!caseService) return;

    setIsLoading(true);
    try {
      const fetchedCases = await caseService.getCases();
      setCases(fetchedCases);

      // Auto-select active case if available
      const activeCaseId = caseService.getActiveCaseId();
      if (activeCaseId) {
        setSelectedCaseId(activeCaseId);
      }
    } catch (err) {
      setError('Failed to load cases');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnroll = async () => {
    if (!caseService) return;

    if (!selectedCaseId) {
      setError('Please select a case');
      return;
    }

    setIsEnrolling(true);
    setError('');

    try {
      await caseService.enrollStudy(
        selectedCaseId,
        studyInstanceUID,
        selectedPhase || undefined,
        {
          studyDate: studyData?.studyDate,
          modalities: studyData?.modalities,
          description: studyData?.description,
        }
      );

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to enroll study');
      setIsEnrolling(false);
    }
  };

  const handleCreateAndEnroll = async () => {
    if (!caseService) return;

    if (!newCaseMrn.trim()) {
      setError('Patient MRN is required');
      return;
    }

    setIsEnrolling(true);
    setError('');

    try {
      // Create new case
      const newCase = await caseService.createCase({
        mrn: newCaseMrn.trim(),
        name: newCaseName.trim() || undefined,
      });

      // Enroll study in new case
      await caseService.enrollStudy(
        newCase.caseId,
        studyInstanceUID,
        selectedPhase || undefined,
        {
          studyDate: studyData?.studyDate,
          modalities: studyData?.modalities,
          description: studyData?.description,
        }
      );

      // Set as active case
      await caseService.setActiveCaseId(newCase.caseId);

      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create case and enroll study');
      setIsEnrolling(false);
    }
  };

  if (showCreateCase) {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-primary-active text-lg font-medium">Create New Case</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreateCase(false)}
            disabled={isEnrolling}
          >
            <Icons.ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
        </div>

        {error && (
          <div className="bg-red-900/20 border-red-500 text-red-300 rounded border p-3 text-sm">
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-primary-light text-sm font-medium">
            Patient MRN <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={newCaseMrn}
            onChange={e => setNewCaseMrn(e.target.value)}
            placeholder="Enter patient MRN"
            className="bg-primary-dark border-primary-light text-primary-active rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isEnrolling}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-primary-light text-sm font-medium">
            Patient Name (Optional)
          </label>
          <input
            type="text"
            value={newCaseName}
            onChange={e => setNewCaseName(e.target.value)}
            placeholder="Smith^John"
            className="bg-primary-dark border-primary-light text-primary-active rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isEnrolling}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-primary-light text-sm font-medium">
            Clinical Phase (Optional)
          </label>
          <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={isEnrolling}>
            <SelectTrigger className="bg-primary-dark border-primary-light text-primary-active">
              <SelectValue placeholder="Select phase (optional)" />
            </SelectTrigger>
            <SelectContent className="bg-primary-dark border-primary-light">
              <SelectItem value="" className="hover:bg-primary">
                <span className="text-primary-light italic">Not specified</span>
              </SelectItem>
              {Object.entries(CLINICAL_PHASE_LABELS).map(([key, label]) => (
                <SelectItem key={key} value={key} className="hover:bg-primary">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="ghost" onClick={onClose} disabled={isEnrolling}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleCreateAndEnroll}
            disabled={isEnrolling || !newCaseMrn.trim()}
          >
            {isEnrolling ? 'Creating...' : 'Create & Enroll'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-primary-active text-lg font-medium">Enroll Study in Case</h3>

      {studyData && (
        <div className="bg-primary-dark rounded border border-primary-light p-3">
          <div className="text-primary-light text-sm space-y-1">
            {studyData.patientName && (
              <div>
                <span className="font-medium">Patient:</span> {studyData.patientName}
              </div>
            )}
            {studyData.mrn && (
              <div>
                <span className="font-medium">MRN:</span> {studyData.mrn}
              </div>
            )}
            {studyData.studyDate && (
              <div>
                <span className="font-medium">Date:</span> {studyData.studyDate}
              </div>
            )}
            {studyData.modalities && studyData.modalities.length > 0 && (
              <div>
                <span className="font-medium">Modalities:</span> {studyData.modalities.join(', ')}
              </div>
            )}
            {studyData.description && (
              <div>
                <span className="font-medium">Description:</span> {studyData.description}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border-red-500 text-red-300 rounded border p-3 text-sm">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <label className="text-primary-light text-sm font-medium">
          Select Case <span className="text-red-500">*</span>
        </label>
        <Select
          value={selectedCaseId}
          onValueChange={setSelectedCaseId}
          disabled={isLoading || isEnrolling}
        >
          <SelectTrigger className="bg-primary-dark border-primary-light text-primary-active">
            <SelectValue placeholder="Select a case..." />
          </SelectTrigger>
          <SelectContent className="bg-primary-dark border-primary-light max-h-[300px]">
            {cases.length === 0 ? (
              <div className="text-primary-light p-2 text-center text-sm italic">
                No cases available
              </div>
            ) : (
              cases.map(caseItem => (
                <SelectItem
                  key={caseItem.caseId}
                  value={caseItem.caseId}
                  className="hover:bg-primary"
                >
                  <div className="flex flex-col py-1">
                    <span className="text-primary-active font-mono text-xs">
                      {caseItem.caseId}
                    </span>
                    <span className="text-primary-light text-xs">
                      {caseItem.patientInfo.name || caseItem.patientInfo.mrn}
                    </span>
                    <span className="text-primary-light text-xs opacity-70">
                      {caseItem.studyCount} {caseItem.studyCount === 1 ? 'study' : 'studies'}
                    </span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowCreateCase(true)}
        disabled={isEnrolling}
        className="self-start"
      >
        <Icons.Plus className="mr-1 h-4 w-4" />
        Create New Case
      </Button>

      <div className="flex flex-col gap-2">
        <label className="text-primary-light text-sm font-medium">
          Clinical Phase (Optional)
        </label>
        <Select value={selectedPhase} onValueChange={setSelectedPhase} disabled={isEnrolling}>
          <SelectTrigger className="bg-primary-dark border-primary-light text-primary-active">
            <SelectValue placeholder="Select phase (optional)" />
          </SelectTrigger>
          <SelectContent className="bg-primary-dark border-primary-light">
            <SelectItem value="" className="hover:bg-primary">
              <span className="text-primary-light italic">Not specified</span>
            </SelectItem>
            {Object.entries(CLINICAL_PHASE_LABELS).map(([key, label]) => (
              <SelectItem key={key} value={key} className="hover:bg-primary">
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="ghost" onClick={onClose} disabled={isEnrolling}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleEnroll}
          disabled={isEnrolling || !selectedCaseId}
        >
          {isEnrolling ? 'Enrolling...' : 'Enroll Study'}
        </Button>
      </div>
    </div>
  );
}

export default StudyEnrollmentDialog;

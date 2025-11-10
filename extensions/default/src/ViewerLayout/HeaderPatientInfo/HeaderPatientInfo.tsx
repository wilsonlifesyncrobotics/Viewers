import React, { useState, useEffect } from 'react';
import usePatientInfo from '../../hooks/usePatientInfo';
import { Icons } from '@ohif/ui-next';

export enum PatientInfoVisibility {
  VISIBLE = 'visible',
  VISIBLE_COLLAPSED = 'visibleCollapsed',
  DISABLED = 'disabled',
  VISIBLE_READONLY = 'visibleReadOnly',
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const formatWithEllipsis = (str, maxLength) => {
  if (str?.length > maxLength) {
    return str.substring(0, maxLength) + '...';
  }
  return str;
};

function HeaderPatientInfo({ servicesManager, appConfig }: withAppTypes) {
  const initialExpandedState =
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE ||
    appConfig.showPatientInfo === PatientInfoVisibility.VISIBLE_READONLY;
  const [expanded, setExpanded] = useState(initialExpandedState);
  const { patientInfo, isMixedPatients } = usePatientInfo(servicesManager);
  const [activeCase, setActiveCase] = useState(null);

  // Get CaseService and subscribe to active case changes
  useEffect(() => {
    const caseService = servicesManager?.services?.caseService;
    if (!caseService) return;

    const loadActiveCase = async () => {
      const caseId = caseService.getActiveCaseId();
      if (caseId) {
        try {
          const caseData = await caseService.getCaseById(caseId);
          setActiveCase(caseData);
        } catch (error) {
          console.warn('Failed to load active case:', error);
          setActiveCase(null);
        }
      } else {
        setActiveCase(null);
      }
    };

    loadActiveCase();

    const unsubscribe = caseService.subscribe(
      caseService.constructor.EVENTS.ACTIVE_CASE_CHANGED,
      async ({ caseId }) => {
        if (caseId) {
          try {
            const caseData = await caseService.getCaseById(caseId);
            setActiveCase(caseData);
          } catch (error) {
            console.warn('Failed to load case:', error);
            setActiveCase(null);
          }
        } else {
          setActiveCase(null);
        }
      }
    );

    return () => unsubscribe?.unsubscribe();
  }, [servicesManager]);

  useEffect(() => {
    if (isMixedPatients && expanded) {
      setExpanded(false);
    }
  }, [isMixedPatients, expanded]);

  const handleOnClick = () => {
    if (!isMixedPatients && appConfig.showPatientInfo !== PatientInfoVisibility.VISIBLE_READONLY) {
      setExpanded(!expanded);
    }
  };

  const formattedPatientName = formatWithEllipsis(patientInfo.PatientName, 27);
  const formattedPatientID = formatWithEllipsis(patientInfo.PatientID, 15);

  return (
    <div className="flex items-center gap-3">
      {/* Case Information */}
      {activeCase && (
        <div className="bg-primary-dark flex items-center gap-2 rounded-lg px-3 py-1.5">
          <Icons.Dashboard className="text-primary h-4 w-4" />
          <div className="flex flex-col">
            <div className="text-[11px] text-[#5acce6]">CASE</div>
            <div className="text-[13px] font-bold text-white">
              {activeCase.caseName || `Case ${activeCase.caseId}`}
            </div>
            {activeCase.surgeryDate && (
              <div className="text-[10px] text-[#a8d5e2]">
                {formatDate(activeCase.surgeryDate)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Patient Information */}
      <div
        className="hover:bg-primary-dark flex cursor-pointer items-center justify-center gap-1 rounded-lg"
        onClick={handleOnClick}
      >
        {isMixedPatients ? (
          <Icons.MultiplePatients className="text-primary" />
        ) : (
          <Icons.Patient className="text-primary" />
        )}
        <div className="flex flex-col justify-center">
          {expanded ? (
            <>
              <div className="self-start text-[13px] font-bold text-white">
                {formattedPatientName}
              </div>
              <div className="text-aqua-pale flex gap-2 text-[11px]">
                <div>{formattedPatientID}</div>
                <div>{patientInfo.PatientSex}</div>
                <div>{patientInfo.PatientDOB}</div>
              </div>
            </>
          ) : (
            <div className="text-primary self-center text-[13px]">
              {isMixedPatients ? 'Multiple Patients' : 'Patient'}
            </div>
          )}
        </div>
        <Icons.ArrowLeft className={`text-primary ${expanded ? 'rotate-180' : ''}`} />
      </div>
    </div>
  );
}

export default HeaderPatientInfo;

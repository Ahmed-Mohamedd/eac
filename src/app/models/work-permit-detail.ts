// Interface for Work Permit Detail (extends the list DTO with full details)
export interface WorkPermitDetailDto {
    // Basic Info
    id: number;
    departmentId: number;
    departmentName: string;
    isRoutineWork: boolean;
    supervisorEng: string;
    workPermitStatusId: number;
    workPermitStatusName: string;

    // Audit Trail
    createdAt: string;
    createdById: number;  // Added for ownership checking
    createdByFullName: string;
    updatedAt?: string;
    updatedByFullName?: string;

    // Work Timings - Planned
    startWorkDate: string;
    startWorkHour: string;
    endWorkDate: string;
    endWorkHour: string;
    dailyWorkHourFrom: string;
    dailyWorkHourTo: string;

    // Work Timings - Actual
    actualWorkEndDate?: string;
    actualWorkEndHour?: string;

    // Work Details
    workDescription: string;
    workLocation?: string;
    usedTools?: string;

    // Hot Work Data
    welding?: boolean;
    cutting?: boolean;
    otherHotWork?: string;

    // Safety and Work Environment
    highestExpectedRise: string;
    descriptionOfUsedScaffoldingAndLadders?: string;
    descriptionOfClosedPlace?: string;
    ventilation?: string;
    potentialWorkRisks?: string;
    fireRisk: string;

    // Safety Equipment
    helmetAndShoes?: boolean;
    gasDustMask?: boolean;
    gloves?: boolean;
    goggles?: boolean;
    harness?: boolean;
    faceShield?: boolean;
    earPlugs?: boolean;
    otherSafetyEquipment?: boolean;

    // Fire Fighting Equipment
    fireExtinguisherRequired?: boolean;
    waterSandRequired?: boolean;
    adequateVentilationRequired?: boolean;
    firefighterRequired?: boolean;
    otherMeansRequired?: boolean;

    // Signature Section
    phoneNumber: string;
    signature: string;
    contractorsRepresentativesSignature?: string;
    occupationalSafteyAndHealthRepresentative?: string;
    isSigned: boolean;  // Track if permit has been signed by S&H

    // Child Collections
    workers: WorkerDto[];
    securityRequirements: string[];
    workLocationIds: number[];
}

export interface WorkerDto {
    id: number;
    workerName: string;
    position: number;
}

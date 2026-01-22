export interface Worker {
    name: string;
}

export interface WorkPermit {
    location: {
        entrance: boolean;
        airfield: boolean;
        buildings: boolean;
    };
    nature: {
        routine: boolean;
        nonRoutine: boolean;
    };
    department: string;
    supervisor: string;
    workers: Worker[];
    timings: {
        date: string;
        time: string;
        expectedEndDate: string;
        expectedEndTime: string;
        actualEndDate: string;
        actualEndTime: string;
        dailyWorkStart: string;
        dailyWorkEnd: string;
    };
    workDescription: string;
    workLocation: string;
    equipment: string;
    hotWork: {
        welding: boolean;
        cutting: boolean;
        other: string;
    };
    heights: {
        maxHeight: string;
        scaffoldingDesc: string;
    };
    confinedSpaces: {
        description: string;
        ventilation: string;
    };
    hazards: string;
    safetyRequirements: {
        ppe: {
            helmet: { required: boolean; notRequired: boolean };
            mask: { required: boolean; notRequired: boolean };
            gloves: { required: boolean; notRequired: boolean };
            goggles: { required: boolean; notRequired: boolean };
            harness: { required: boolean; notRequired: boolean };
            faceShield: { required: boolean; notRequired: boolean };
            earPlugs: { required: boolean; notRequired: boolean };
            other: { required: boolean; notRequired: boolean };
        };
        securityRequirements: string[];
        fireRisk: string; // "Yes" or "No"
        fireSafety: {
            extinguisher: { required: boolean; notRequired: boolean };
            waterSand: { required: boolean; notRequired: boolean };
            ventilation: { required: boolean; notRequired: boolean };
            fireman: { required: boolean; notRequired: boolean };
            other: { required: boolean; notRequired: boolean };
        };
    };
    signatures: {
        engineer: string;
        contractor: string;
        phone: string;
        signature: string;
        safetyOfficer: string;
    };
}

/**
 * @file biometric-record.entity.js
 * @description Entidad de dominio BiometricRecord para clinical-risk.
 */
export class BiometricRecord {
  #id; #medicalStaffId; #heartRate; #hrv; #cortisol
  #sleepHours; #stressLevel; #fatigueLevel; #steps; #recordedAt

  constructor ({ id=null, medicalStaffId=null, heartRate=0, hrv=0, cortisol=0,
    sleepHours=0, stressLevel=0, fatigueLevel=0, steps=0, recordedAt=null } = {}) {
    this.#id = id; this.#medicalStaffId = medicalStaffId; this.#heartRate = heartRate
    this.#hrv = hrv; this.#cortisol = cortisol; this.#sleepHours = sleepHours
    this.#stressLevel = stressLevel; this.#fatigueLevel = fatigueLevel
    this.#steps = steps; this.#recordedAt = recordedAt
  }

  get id () { return this.#id }
  get medicalStaffId () { return this.#medicalStaffId }
  get heartRate () { return this.#heartRate }
  get hrv () { return this.#hrv }
  get cortisol () { return this.#cortisol }
  get sleepHours () { return this.#sleepHours }
  get stressLevel () { return this.#stressLevel }
  get fatigueLevel () { return this.#fatigueLevel }
  get steps () { return this.#steps }
  get recordedAt () { return this.#recordedAt }

  /** @returns {boolean} Indica si algún valor está fuera del rango normal. */
  get hasAnomalies () {
    return this.#heartRate > 100 || this.#heartRate < 60
        || this.#hrv < 30
        || this.#cortisol > 600
        || this.#sleepHours < 6
  }

  toResource () {
    return { id: this.#id, medicalStaffId: this.#medicalStaffId, heartRate: this.#heartRate,
      hrv: this.#hrv, cortisol: this.#cortisol, sleepHours: this.#sleepHours,
      stressLevel: this.#stressLevel, fatigueLevel: this.#fatigueLevel,
      steps: this.#steps, recordedAt: this.#recordedAt }
  }
}

/**
 * @file shift.entity.js
 * @description Entidad de dominio Shift para shift-coordination.
 */
export class Shift {
  #id; #medicalStaffId; #date; #type; #startTime; #endTime; #area; #hoursWorked; #status

  constructor ({ id=null, medicalStaffId=null, date=null, type='morning',
    startTime='', endTime='', area='', hoursWorked=0, status='scheduled' } = {}) {
    this.#id = id; this.#medicalStaffId = medicalStaffId; this.#date = date
    this.#type = type; this.#startTime = startTime; this.#endTime = endTime
    this.#area = area; this.#hoursWorked = hoursWorked; this.#status = status
  }

  get id () { return this.#id }
  get medicalStaffId () { return this.#medicalStaffId }
  get date () { return this.#date }
  get type () { return this.#type }
  get startTime () { return this.#startTime }
  get endTime () { return this.#endTime }
  get area () { return this.#area }
  get hoursWorked () { return this.#hoursWorked }
  get status () { return this.#status }
  get isNight () { return this.#type === 'night' }

  toResource () {
    return { id: this.#id, medicalStaffId: this.#medicalStaffId, date: this.#date,
      type: this.#type, startTime: this.#startTime, endTime: this.#endTime,
      area: this.#area, hoursWorked: this.#hoursWorked, status: this.#status }
  }
}

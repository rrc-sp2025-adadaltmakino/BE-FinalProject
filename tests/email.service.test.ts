import nodemailer from "nodemailer";
import {
    sendAppointmentConfirmation,
    sendCancellationNotice,
    sendAppointmentUpdateNotification,
    sendDoctorNewAppointmentNotice,
    sendDoctorAppointmentUpdate,
    sendDoctorCancellationNotice,
} from "../src/api/v1/services/emailService";

jest.mock("nodemailer", () => ({
    __esModule: true,
    default: {
        createTransport: jest.fn().mockReturnValue({
            sendMail: jest.fn(),
        }),
    },
}));

const mockSendMail = (nodemailer.createTransport as jest.Mock).mock.results[0].value
    .sendMail as jest.Mock;

describe("Email Service", () => {
    beforeEach(() => {
        mockSendMail.mockClear();
        mockSendMail.mockResolvedValue(undefined);
    });

    // Patient Emails 

    describe("sendAppointmentConfirmation", () => {
        it("should call sendMail with correct to, subject, and from", async () => {
            await sendAppointmentConfirmation("patient@test.com", "Dr. Smith", "2026-05-01");

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: process.env.EMAIL_FROM,
                    to: "patient@test.com",
                    subject: "Appointment Confirmed",
                })
            );
        });

        it("should include doctorName and date in the html body", async () => {
            await sendAppointmentConfirmation("patient@test.com", "Dr. Smith", "2026-05-01");

            const { html } = mockSendMail.mock.calls[0][0];
            expect(html).toContain("Dr. Smith");
            expect(html).toContain("2026-05-01");
        });

        it("should throw if sendMail fails", async () => {
            mockSendMail.mockRejectedValue(new Error("SMTP error"));

            await expect(
                sendAppointmentConfirmation("patient@test.com", "Dr. Smith", "2026-05-01")
            ).rejects.toThrow("SMTP error");
        });
    });

    describe("sendCancellationNotice", () => {
        it("should call sendMail with correct to, subject, and from", async () => {
            await sendCancellationNotice("patient@test.com", "Dr. Jones", "2026-05-02");

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: process.env.EMAIL_FROM,
                    to: "patient@test.com",
                    subject: "Appointment Cancelled",
                })
            );
        });

        it("should include doctorName and date in the html body", async () => {
            await sendCancellationNotice("patient@test.com", "Dr. Jones", "2026-05-02");

            const { html } = mockSendMail.mock.calls[0][0];
            expect(html).toContain("Dr. Jones");
            expect(html).toContain("2026-05-02");
        });

        it("should throw if sendMail fails", async () => {
            mockSendMail.mockRejectedValue(new Error("SMTP error"));

            await expect(
                sendCancellationNotice("patient@test.com", "Dr. Jones", "2026-05-02")
            ).rejects.toThrow("SMTP error");
        });
    });

    describe("sendAppointmentUpdateNotification", () => {
        it("should call sendMail with correct to, subject, and from", async () => {
            await sendAppointmentUpdateNotification("patient@test.com", "Dr. Lee", "2026-05-03", "confirmed");

            expect(mockSendMail).toHaveBeenCalledTimes(1);
            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    from: process.env.EMAIL_FROM,
                    to: "patient@test.com",
                    subject: "Appointment Status Update",
                })
            );
        });

        it("should include doctorName, date, and status in the html body", async () => {
            await sendAppointmentUpdateNotification("patient@test.com", "Dr. Lee", "2026-05-03", "confirmed");

            const { html } = mockSendMail.mock.calls[0][0];
            expect(html).toContain("Dr. Lee");
            expect(html).toContain("2026-05-03");
            expect(html).toContain("confirmed");
        });

        it("should reflect a different status in the html body", async () => {
            await sendAppointmentUpdateNotification("patient@test.com", "Dr. Lee", "2026-05-03", "cancelled");

            const { html } = mockSendMail.mock.calls[0][0];
            expect(html).toContain("cancelled");
        });

        it("should throw if sendMail fails", async () => {
            mockSendMail.mockRejectedValue(new Error("SMTP error"));

            await expect(
                sendAppointmentUpdateNotification("patient@test.com", "Dr. Lee", "2026-05-03", "confirmed")
            ).rejects.toThrow("SMTP error");
        });
    });

    // Doctor Emails

    describe("sendDoctorNewAppointmentNotice", () => {
        it("should send to doctor with correct subject", async () => {
            await sendDoctorNewAppointmentNotice("doctor@test.com", "John Doe", "2026-05-01");

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "doctor@test.com",
                    subject: "New Appointment Booked",
                })
            );
        });

        it("should include patientName and date in the html body", async () => {
            await sendDoctorNewAppointmentNotice("doctor@test.com", "John Doe", "2026-05-01");

            const { html } = mockSendMail.mock.calls[0][0];
            expect(html).toContain("John Doe");
            expect(html).toContain("2026-05-01");
        });

        it("should throw if sendMail fails", async () => {
            mockSendMail.mockRejectedValue(new Error("SMTP error"));

            await expect(
                sendDoctorNewAppointmentNotice("doctor@test.com", "John Doe", "2026-05-01")
            ).rejects.toThrow("SMTP error");
        });
    });

    describe("sendDoctorAppointmentUpdate", () => {
        it("should send to doctor with correct subject", async () => {
            await sendDoctorAppointmentUpdate("doctor@test.com", "John Doe", "2026-05-01", "confirmed");

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "doctor@test.com",
                    subject: "Appointment Status Updated",
                })
            );
        });

        it("should include patientName, date, and status in the html body", async () => {
            await sendDoctorAppointmentUpdate("doctor@test.com", "John Doe", "2026-05-01", "confirmed");

            const { html } = mockSendMail.mock.calls[0][0];
            expect(html).toContain("John Doe");
            expect(html).toContain("2026-05-01");
            expect(html).toContain("confirmed");
        });

        it("should throw if sendMail fails", async () => {
            mockSendMail.mockRejectedValue(new Error("SMTP error"));

            await expect(
                sendDoctorAppointmentUpdate("doctor@test.com", "John Doe", "2026-05-01", "confirmed")
            ).rejects.toThrow("SMTP error");
        });
    });

    describe("sendDoctorCancellationNotice", () => {
        it("should send to doctor with correct subject", async () => {
            await sendDoctorCancellationNotice("doctor@test.com", "John Doe", "2026-05-01");

            expect(mockSendMail).toHaveBeenCalledWith(
                expect.objectContaining({
                    to: "doctor@test.com",
                    subject: "Appointment Cancelled",
                })
            );
        });

        it("should include patientName and date in the html body", async () => {
            await sendDoctorCancellationNotice("doctor@test.com", "John Doe", "2026-05-01");

            const { html } = mockSendMail.mock.calls[0][0];
            expect(html).toContain("John Doe");
            expect(html).toContain("2026-05-01");
        });

        it("should throw if sendMail fails", async () => {
            mockSendMail.mockRejectedValue(new Error("SMTP error"));

            await expect(
                sendDoctorCancellationNotice("doctor@test.com", "John Doe", "2026-05-01")
            ).rejects.toThrow("SMTP error");
        });
    });
});
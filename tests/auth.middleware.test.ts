import { Request, Response, NextFunction } from 'express';
import authenticate from '../src/api/v1/middleware/authenticate';
import { auth } from '../config/firebaseConfig';
import { AuthenticationError } from "../src/api/v1/errors/errors";

// Mock the Firebase config module
jest.mock("../config/firebaseConfig", () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

// Mock the AuthenticationError so we can check instanceof
jest.mock("../src/api/v1/errors/errors", () => {
  return {
    AuthenticationError: class AuthenticationError extends Error {
      public code: string;
      constructor(message: string, code: string) {
        super(message);
        this.name = "AuthenticationError";
        this.code = code;
      }
    },
  };
});

describe("authenticate Middleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = { headers: {} };
    mockRes = {
      locals: {},
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });



  describe("valid token", () => {
    it("should call next() with no arguments when token is valid", async () => {
      // Arrange
      const mockDecodedToken = { uid: "user-123", role: "patient" };
      mockReq.headers = { authorization: "Bearer valid-token" };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(auth.verifyIdToken).toHaveBeenCalledWith("valid-token");
      expect(mockNext).toHaveBeenCalledWith(/* nothing */);
      expect(mockNext).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it("should store uid and role in res.locals", async () => {
      // Arrange
      const mockDecodedToken = { uid: "user-123", role: "doctor" };
      mockReq.headers = { authorization: "Bearer valid-token" };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(mockRes.locals!.uid).toBe("user-123");
      expect(mockRes.locals!.role).toBe("doctor");
    });

    it("should store undefined role when token has no role claim", async () => {
      // Arrange — token has no custom role claim
      const mockDecodedToken = { uid: "user-456" };
      mockReq.headers = { authorization: "Bearer no-role-token" };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue(mockDecodedToken);

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(mockRes.locals!.uid).toBe("user-456");
      expect(mockRes.locals!.role).toBeUndefined();
      expect(mockNext).toHaveBeenCalledWith(/* nothing */);
    });
  });



  describe("missing token", () => {
    it("should call next(AuthenticationError) when no Authorization header is provided", async () => {
      // Arrange
      mockReq.headers = {};

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("No token provided");
      expect(error.code).toBe("TOKEN_NOT_FOUND");
    });

    it("should call next(AuthenticationError) when Authorization header exists but has no Bearer prefix", async () => {
      // Arrange — header exists but wrong format
      mockReq.headers = { authorization: "Basic somebasictoken" };

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.code).toBe("TOKEN_NOT_FOUND");
    });

    it("should NOT call res.status or res.json (errors handled via next)", async () => {
      // Arrange
      mockReq.headers = {};

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockRes.json).not.toHaveBeenCalled();
    });
  });



  describe("invalid token", () => {
    it("should call next(AuthenticationError) with TOKEN_INVALID when verifyIdToken throws", async () => {
      // Arrange
      mockReq.headers = { authorization: "Bearer expired-token" };
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(
        new Error("Firebase: Token has been revoked")
      );

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(mockNext).toHaveBeenCalledWith(expect.any(AuthenticationError));
      const error = (mockNext as jest.Mock).mock.calls[0][0];
      expect(error.message).toContain("Token verification failed");
      expect(error.code).toBe("TOKEN_INVALID");
    });

    it("should re-throw AuthenticationError if already an AuthenticationError", async () => {
      // Arrange — verifyIdToken itself throws an AuthenticationError
      mockReq.headers = { authorization: "Bearer some-token" };
      const originalError = new AuthenticationError("Custom auth error", "CUSTOM_CODE");
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(originalError);

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert — the original error should be passed through, not wrapped
      const passedError = (mockNext as jest.Mock).mock.calls[0][0];
      expect(passedError).toBe(originalError);
      expect(passedError.code).toBe("CUSTOM_CODE");
    });

    it("should NOT store anything in res.locals on failure", async () => {
      // Arrange
      mockReq.headers = { authorization: "Bearer bad-token" };
      (auth.verifyIdToken as jest.Mock).mockRejectedValue(new Error("Bad token"));

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(mockRes.locals!.uid).toBeUndefined();
      expect(mockRes.locals!.role).toBeUndefined();
    });
  });



  describe("token extraction", () => {
    it("should strip the 'Bearer ' prefix and pass only the raw token to verifyIdToken", async () => {
      // Arrange
      const rawToken = "eyJhbGciOiJSUzI1NiJ9.payload.signature";
      mockReq.headers = { authorization: `Bearer ${rawToken}` };
      (auth.verifyIdToken as jest.Mock).mockResolvedValue({ uid: "u-1", role: "admin" });

      // Act
      await authenticate(
        mockReq as Request,
        mockRes as Response,
        mockNext
      );

      // Assert
      expect(auth.verifyIdToken).toHaveBeenCalledWith(rawToken);
      expect(auth.verifyIdToken).not.toHaveBeenCalledWith(`Bearer ${rawToken}`);
    });
  });
});

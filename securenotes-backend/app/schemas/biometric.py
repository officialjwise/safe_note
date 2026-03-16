"""Biometric authentication schema"""

from pydantic import BaseModel, Field


class BiometricEnrollRequest(BaseModel):
    """Request to enroll biometric authentication"""
    device_id: str = Field(..., description="Unique device identifier")
    biometric_type: str = Field(..., description="Type: fingerprint, face, iris")
    enrolled: bool = Field(default=True, description="Whether biometric is enrolled")


class BiometricAuthRequest(BaseModel):
    """Request to authenticate with biometric"""
    device_id: str = Field(..., description="Unique device identifier")
    biometric_type: str = Field(..., description="Type: fingerprint, face, iris")


class BiometricStatus(BaseModel):
    """Biometric status response"""
    enrolled: bool
    device_id: str
    biometric_type: str
    last_used: str | None = None

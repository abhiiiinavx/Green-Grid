from pydantic import BaseModel, Field
from typing import List, Optional

class HistoricalDataPoint(BaseModel):
    timestamp: str
    hour: Optional[int] = None
    day_of_week: Optional[int] = None
    kwh: float
    temperature_c: Optional[float] = None
    solar_kwh: Optional[float] = 0.0

class DemandForecastRequest(BaseModel):
    history: List[HistoricalDataPoint]
    hours_ahead: int = Field(default=24, ge=1, le=168)
    user_type: str = "HOME"

class HourlyForecastOutput(BaseModel):
    time_label: str
    hour: int
    predicted_kwh: float
    confidence_low: float
    confidence_high: float
    is_peak_period: bool

class DemandForecastResponse(BaseModel):
    status: str
    model_name: str
    forecast_points: List[HourlyForecastOutput]
    total_predicted_kwh: float

class AnomalyDetectionRequest(BaseModel):
    readings: List[float]
    current_reading: float
    threshold_std_dev: float = 2.0

class AnomalyDetectionResponse(BaseModel):
    is_anomaly: bool
    current_value: float
    expected_mean: float
    std_dev: float
    z_score: float
    severity: str
    message: str

class BillForecastRequest(BaseModel):
    month_to_date_kwh: float
    days_passed: int
    total_days_in_month: int
    tariff_rate_per_kwh: float = 6.5
    fixed_charge: float = 140.0
    tax_percent: float = 9.0

class BillForecastResponse(BaseModel):
    projected_month_end_kwh: float
    estimated_bill_currency: float
    confidence_interval_low: float
    confidence_interval_high: float
    daily_average_kwh: float

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from models import (
    DemandForecastRequest, DemandForecastResponse,
    AnomalyDetectionRequest, AnomalyDetectionResponse,
    BillForecastRequest, BillForecastResponse
)
from predictor import predictor

app = FastAPI(
    title="Green Grid AI Analytics & Prediction Service",
    description="Machine Learning service for demand forecasting, bill projection, and anomaly detection.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "Green Grid AI Service",
        "status": "ONLINE",
        "version": "1.0.0",
        "models": ["Demand-Forecaster", "Bill-Regressor", "Spike-Anomaly-Detector"]
    }

@app.get("/health")
def health_check():
    return {"status": "HEALTHY", "ai_pipeline": "OPERATIONAL"}

@app.post("/predict/demand", response_model=DemandForecastResponse)
def predict_demand(request: DemandForecastRequest):
    try:
        return predictor.forecast_demand(
            history=request.history,
            hours_ahead=request.hours_ahead,
            user_type=request.user_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect/anomalies", response_model=AnomalyDetectionResponse)
def detect_anomalies(request: AnomalyDetectionRequest):
    try:
        return predictor.detect_anomaly(
            readings=request.readings,
            current_reading=request.current_reading,
            threshold_std_dev=request.threshold_std_dev
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/bill", response_model=BillForecastResponse)
def predict_bill(request: BillForecastRequest):
    try:
        return predictor.predict_bill(
            month_to_date_kwh=request.month_to_date_kwh,
            days_passed=request.days_passed,
            total_days_in_month=request.total_days_in_month,
            tariff_rate_per_kwh=request.tariff_rate_per_kwh,
            fixed_charge=request.fixed_charge,
            tax_percent=request.tax_percent
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

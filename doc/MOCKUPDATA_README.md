# Sample Coverage Data

This directory contains sample data for testing the coverage verification functionality.

## Sample Coverage Data Structure

The `sampleCoverageData.json` file contains a complete example of a coverage verification response based on the Availity API documentation at:
https://developer.availity.com/partner/product/287860/api/223464

### Data Structure

The sample data includes:

#### 1. **Basic Information**
- `id`: Coverage identifier (6364793487228928)
- `controlNumber`: Tracking number (CTRL-2024-001234)
- `status`: Request status (Completed)
- `createdDate`, `updatedDate`, `expirationDate`: Timestamps

#### 2. **Payer Information**
- Payer ID: 614426698842112
- Name: Sample Insurance Company
- Response codes and descriptions

#### 3. **Provider Information**
- NPI: 1234567890
- Name: Dr. John Dentist
- Specialty: General Dentistry
- Full address and contact information

#### 4. **Patient Information**
- Member ID: MEM123456789
- Name: Jane Marie Smith
- Birth date: 1985-03-15
- Full demographics and contact information

#### 5. **Subscriber Information**
- Relationship to patient (Self)
- Member details

#### 6. **Coverage Plans**

**Comprehensive Dental Plan (GRP-98765)**

**Deductibles:**
- Individual: $50 (remaining: $25)
- Family: $150 (remaining: $100)

**Maximum Benefit:**
- Annual maximum: $2,000 (remaining: $1,500)

**Coverage Levels:**

- **Preventive Care (100%)**
  - Routine cleanings (2 per year)
  - Examinations (2 per year)
  - X-rays (1 set per year)
  - Fluoride treatments (ages 0-18)

- **Basic Services (80%)**
  - Fillings
  - Simple extractions
  - Emergency care

- **Major Services (50%)**
  - Crowns
  - Bridges
  - Dentures
  - Root canals
  - 12-month waiting period

- **Orthodontics (50%)**
  - Lifetime maximum: $1,500
  - Age limit: 19

**Limitations:**
- Prophylaxis: 2 per calendar year (last: 2024-05-15)
- Bitewing X-rays: 2 per calendar year (last: 2024-05-15)
- Full Mouth X-rays: 1 per 3 years (last: 2023-01-10)

**Exclusions:**
- Cosmetic dentistry
- Teeth whitening
- Dental implants (unless medically necessary)

#### 7. **Additional Information**
- Coordination of benefits (primary plan)
- Prior authorization requirements
- Claims address
- Customer service contact: 1-800-555-DENT
- Member portal: https://www.sampleinsurance.com

## How to Use Sample Data

### In the UI

Click the **"Load Sample Data"** button (purple button) in the verification form header to load and display this sample data in the modal.

### For Testing

This sample data is useful for:

1. **UI Testing**: See how the coverage modal displays real-world data
2. **Development**: Test UI components without making API calls
3. **Documentation**: Understand the structure of Availity API responses
4. **Demos**: Show the application functionality without live credentials

## Modifying Sample Data

To customize the sample data:

1. Edit `sampleCoverageData.json`
2. Follow the structure defined in the Availity API documentation
3. Ensure all required fields are present
4. Validate the JSON syntax
5. Rebuild the application (`npm run build`)

## API Response Mapping

The sample data structure maps to the Availity API `CoverageSummary` response:

```
POST /coverages → CoverageSummary
GET /coverages/:id → CoverageSummary
```

Key fields from API documentation:
- Core identification (id, controlNumber, status)
- Payer details (payerId, name, response codes)
- Provider information (NPI, name, specialty)
- Patient demographics (memberId, name, DOB, address)
- Plan details (benefits, limitations, exclusions)
- Validation messages and errors

## Notes

- SSN is masked in sample data (***-**-4567)
- Dates use ISO 8601 format (YYYY-MM-DD or full timestamp)
- All monetary amounts are in USD
- Percentages represent coverage levels (100 = 100% covered)
- Service codes follow standard dental procedure codes (e.g., D1110 for prophylaxis)

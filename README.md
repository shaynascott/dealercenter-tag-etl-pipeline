# DealerCenter Multi-Stream Tag & Compliance ETL Pipeline

A zero-cost, serverless ETL (Extract, Transform, Load) pipeline built with **Google Apps Script (JavaScript)**, **Gmail Filters**, and **Google Sheets** to automate daily automotive tag and title compliance logging from DealerCenter.

---

## The Problem
Logging vehicle tags for state compliance (PennDOT / PA Passenger, PA Trucks, and Out-of-State Temp Tags) required manually re-entering 17+ fields such as customer info, cosigner info, full addresses, insurance details, and VINs from DealerCenter into separate spreadsheets. Because DealerCenter does not provide a public API or native Zapier integration, manual entry was slow, repetitive, and prone to transcription errors.

## The Solution
I engineered a fully automated, event-routed ETL pipeline with **$0 software cost** that extracts daily filtered CSV reports from DealerCenter, routes them via Gmail labels, transforms and normalizes the schema in Google Apps Script, and loads deduplicated records into a centralized 3-tab Google Sheet.

### Architecture

```mermaid
flowchart LR
    A[DealerCenter<br/>3 Filtered CSV Reports] -->|Daily 10:00 AM Email| B[Gmail<br/>Auto-Filters & Labels]
    B -->|Time-Driven Trigger| C[Google Apps Script<br/>ETL & Deduplication]
    C -->|Append Only Columns A-I| D[Google Sheets<br/>3-Tab Compliance Log]

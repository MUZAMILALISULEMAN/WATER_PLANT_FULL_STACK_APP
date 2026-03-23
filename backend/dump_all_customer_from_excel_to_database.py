import pandas as pd
import requests as rq

df = pd.read_excel("file.xlsx",sheet_name="JAN 26",nrows=63,usecols="B,C,D,G",dtype={'Phone Number': str})
df =  df.fillna('')
for i, rows in df.iterrows():
    requestBody = {}
    requestBody["name"] = rows["Customer Name"]
    requestBody["address"] = rows["Address"]
    requestBody["unit_price"] = rows["Rate"]
    requestBody["cell_phone"] = rows["Phone Number"]
    try:
     response = rq.post(url = "http://127.0.0.1:8001/customer/add",json=requestBody,timeout=5)
     if response.status_code == 201:
        print("SUCCESS")
     else:
        print(rows," failed broo..")
    except rq.exceptions.RequestException as e:
        print(f"Connection Error on row {i+1}: {e}")    
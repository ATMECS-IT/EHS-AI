import re
import json

def format_section2(h):
    if not h:
        return {}

    # Parse pictograms (stored as string list)
    pictograms = []
    if h.get("pictograms"):
        try:
            pictograms = json.loads(h["pictograms"])
        except:
            pictograms = []

    # Extract hazards from classification
    hazards = []
    if h.get("classification"):
        for part in h["classification"].split(";"):
            hazards.append(part.split(",")[0].strip())

    # Extract H codes
    hazard_codes = re.findall(r"H\d{3}", h.get("hazard_statements", ""))

    # Extract P codes
    precautionary_codes = re.findall(r"P[\d\+]+", h.get("precautionary_statements", ""))

    return {
        "classification": h.get("classification"),
        "hazards": hazards,
        "ghs_codes": pictograms + hazard_codes,
        "signal_word": h.get("signal_word"),
        "hazard_statements": h.get("hazard_statements", "").strip('"'),
        "precautionary_codes": precautionary_codes,
        "precautionary_statements": h.get("precautionary_statements", "").strip('"'),
        "carcinogenicity": "Not specified in source material.",
        "additional_notes": "These classifications are explicitly stated by the manufacturer in Section 2 and supported by component toxicology in Sections 3 and 11."
    }



def format_section3(composition, sds_info, ghs, dg):
    if not composition:
        return {}

    # Chemical nature (take from first row product_type)
    chemical_nature = composition[0].get("product_type")

    # Build description
    description = (
        f"{sds_info.get('product_name', '')} - Fragrance / Perfume compound. "
        f"Product Identifier: {sds_info.get('product_identifier', '')}, "
        f"Internal code: {sds_info.get('material_code', '')}. "
        f"Manufacturer: {sds_info.get('supplier_name', '')}, "
        f"{sds_info.get('supplier_address', '')}."
    )

    formatted_composition = []
    for item in composition:
        formatted_composition.append({
            "chemical_name": item.get("chemical_name"),
            "cas_number": item.get("cas_number"),
            "concentration": item.get("concentration"),
            "ghs_classification": [],
            "hazard_statements": []
        })

    return {
        "chemical_nature": chemical_nature,
        "description": description,
        "composition": formatted_composition
    }



def format_section9(props):
    if not props:
        return {}

    def clean_text(val):
        if not val:
            return val
        return (
            val.replace("Â°F", "°F")
               .replace("Â°C", "°C")
               .strip()
        )

    flash_point = clean_text(props.get("flash_point"))

    return {
        "physical_state": props.get("physical_state"),
        "appearance": props.get("appearance"),
        "odour": props.get("odor"),  # rename
        "flash_point": flash_point,
        "boiling_point": props.get("boiling_point"),
        "vapour_pressure": props.get("vapor_pressure"),
        "note": (
            "Flash point exceeds 60 °C, excluding it from Class 3 flammable liquids "
            "but still meeting the U.S. definition of a combustible liquid."
            if flash_point and "°C" in flash_point else None
        )
    }



import ast

def clean_text(val):
    if not val:
        return val
    return (
        val.replace("â†’", "→")
           .replace("â‰¤", "≤")
           .replace("Â", "")
           .strip()
    )

def parse_dict_string(val):
    try:
        return ast.literal_eval(val) if val else {}
    except:
        return {}


def to_snake_case_dict(d):
    if not d:
        return {}

    def camel_to_snake(key):
        return re.sub(r'(?<!^)(?=[A-Z])', '_', key).lower()

    return {camel_to_snake(k): v for k, v in d.items()}

def format_section14(t):
    if not t:
        return {}

    iata_raw = parse_dict_string(t.get("air_transport"))
    imdg_raw = parse_dict_string(t.get("maritime_transport"))

    return {
        "dot": t.get("road_transport"),
        "iata": to_snake_case_dict(iata_raw),
        "imdg": to_snake_case_dict(imdg_raw),
        "otherInformation": t.get("special_precautions")
    }
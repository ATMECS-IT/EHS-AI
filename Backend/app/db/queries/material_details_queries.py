class MaterialDetailsQueries:

    MASTER = """
    SELECT *
    FROM material_sds_master
    WHERE material_code = :material_code
    """

    SDS_INFO = """
    SELECT *
    FROM sds_table
    WHERE material_code = :material_code
    """

    HAZARDS = """
    SELECT *
    FROM sds_hazards
    WHERE material_code = :material_code
    """

    COMPOSITION = """
    SELECT chemical_name, cas_number, concentration, product_type
    FROM sds_composition
    WHERE material_id = :material_id
    ORDER BY ingredient_sequence
    """

    TOXICOLOGY = """
    SELECT *
    FROM sds_toxicology
    WHERE material_id = :material_id
    """

    PROPERTIES = """
    SELECT physical_state, appearance, odor, flash_point, boiling_point, vapor_pressure, raw_text
    FROM sds_properties
    WHERE material_code = :material_code
    """

    TRANSPORT = """
    SELECT *
    FROM sds_transportation
    WHERE material_code = :material_code
    """

    GHS = """
    SELECT *
    FROM material_ghs_classification
    WHERE material_code = :material_code
    """

    DG = """
    SELECT *
    FROM material_dg_classification
    WHERE material_code = :material_code
    """

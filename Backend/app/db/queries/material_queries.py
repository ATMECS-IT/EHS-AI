class MaterialQueries:

    GET_MASTER_BY_TYPE = """
        SELECT *
        FROM material_sds_master
        WHERE source_material_type = :material_type
        ORDER BY extraction_timestamp DESC
    """

    COUNT_BY_TYPE = """
        SELECT COUNT(*) as total
        FROM material_sds_master
        WHERE source_material_type = :material_type
    """

    GET_BY_TYPE = """
        SELECT *
        FROM material_sds_master
        WHERE source_material_type = :material_type
        ORDER BY extraction_timestamp DESC
        LIMIT :limit OFFSET :offset
    """

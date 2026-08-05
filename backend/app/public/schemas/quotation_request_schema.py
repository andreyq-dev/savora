"""Schema for public quotation request form."""

from marshmallow import Schema, fields, validate


class QuotationRequestSchema(Schema):
    """Schema for public quotation request submissions (no auth required)."""

    chef_id = fields.Int(required=True, strict=True)
    name = fields.Str(required=True, validate=validate.Length(min=2, max=100))
    email = fields.Email(required=True)
    phone = fields.Str(required=False, allow_none=True, validate=validate.Length(max=20))
    event_description = fields.Str(required=True, validate=validate.Length(min=10, max=2000))
    event_date = fields.Str(required=False, allow_none=True)
    guests = fields.Int(required=False, allow_none=True, strict=True)
    budget = fields.Float(required=False, allow_none=True)

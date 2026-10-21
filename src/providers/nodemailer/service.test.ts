import type { ProviderSendNotificationDTO } from "@medusajs/framework/types"
import { describe, expect, it } from "vitest"
import {
	binaryStringToBuffer,
	buildMailOptions,
	extractProviderData,
	isBase64String,
	isBinaryString,
	processAttachmentContent,
} from "./service"

describe("isBinaryString", () => {
	it("should return true for valid binary strings", () => {
		// "Hi" in binary
		expect(isBinaryString("0100100001101001")).toBe(true)
		// Single byte
		expect(isBinaryString("01001000")).toBe(true)
		// Multiple bytes
		expect(isBinaryString("010010000110100101101100")).toBe(true)
	})

	it("should return false for strings containing non-binary characters", () => {
		expect(isBinaryString("Hello World")).toBe(false)
		expect(isBinaryString("01234567")).toBe(false)
		expect(isBinaryString("0100100a")).toBe(false)
	})

	it("should return false for strings not divisible by 8", () => {
		expect(isBinaryString("0100100")).toBe(false) // 7 chars
		expect(isBinaryString("010010001")).toBe(false) // 9 chars
	})

	it("should return false for empty strings", () => {
		expect(isBinaryString("")).toBe(false)
	})

	it("should return false for strings shorter than 8 characters", () => {
		expect(isBinaryString("0101")).toBe(false)
	})

	it("should return false for base64 strings", () => {
		// Base64 encoded "Hello"
		expect(isBinaryString("SGVsbG8=")).toBe(false)
	})
})

describe("binaryStringToBuffer", () => {
	it("should convert binary string to correct buffer", () => {
		// "Hi" = H(72) + i(105) in ASCII
		const binaryHi = "0100100001101001"
		const buffer = binaryStringToBuffer(binaryHi)
		expect(buffer.toString()).toBe("Hi")
	})

	it("should handle single byte", () => {
		// 'A' = 65 in ASCII = 01000001 in binary
		const buffer = binaryStringToBuffer("01000001")
		expect(buffer.toString()).toBe("A")
	})

	it("should handle longer strings", () => {
		// "Hello" in binary
		const hello = Buffer.from("Hello")
		const binaryHello = [...hello]
			.map((byte) => byte.toString(2).padStart(8, "0"))
			.join("")
		const buffer = binaryStringToBuffer(binaryHello)
		expect(buffer.toString()).toBe("Hello")
	})

	it("should correctly roundtrip binary data", () => {
		// Create a buffer with various byte values including non-printable chars
		const originalBuffer = Buffer.from([
			0, 127, 128, 255, 72, 101, 108, 108, 111,
		])
		const binaryString = [...originalBuffer]
			.map((byte) => byte.toString(2).padStart(8, "0"))
			.join("")
		const resultBuffer = binaryStringToBuffer(binaryString)
		expect(resultBuffer).toEqual(originalBuffer)
	})
})

describe("processAttachmentContent", () => {
	it("should pass through Buffer content unchanged", () => {
		const buffer = Buffer.from("Hello World")
		const result = processAttachmentContent(buffer)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect(result).toBe(buffer)
	})

	it("should convert binary digit strings to Buffer", () => {
		// "Hi" in binary
		const binaryHi = "0100100001101001"
		const result = processAttachmentContent(binaryHi)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect((result as Buffer).toString()).toBe("Hi")
	})

	it("should pass through regular strings (like base64)", () => {
		const base64Content = "SGVsbG8gV29ybGQ="
		const result = processAttachmentContent(base64Content)
		expect(typeof result).toBe("string")
		expect(result).toBe(base64Content)
	})

	it("should pass through plain text content", () => {
		const textContent = "Hello World"
		const result = processAttachmentContent(textContent)
		expect(typeof result).toBe("string")
		expect(result).toBe(textContent)
	})

	it("should handle PDF-like binary content", () => {
		// Simulate a small "PDF" file being converted to binary string format
		const fakePdfBuffer = Buffer.from("%PDF-1.4 test content")
		const binaryString = [...fakePdfBuffer]
			.map((byte) => byte.toString(2).padStart(8, "0"))
			.join("")
		const result = processAttachmentContent(binaryString)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect((result as Buffer).toString()).toBe("%PDF-1.4 test content")
	})

	it("should handle PNG-like binary content with null bytes", () => {
		// PNG signature starts with specific bytes including nulls
		const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
		const binaryString = [...pngSignature]
			.map((byte) => byte.toString(2).padStart(8, "0"))
			.join("")
		const result = processAttachmentContent(binaryString)
		expect(Buffer.isBuffer(result)).toBe(true)
		expect(result).toEqual(pngSignature)
	})
})

describe("extractProviderData", () => {
	it("should extract replyTo from provider_data", () => {
		expect(extractProviderData({ replyTo: "r@x.com" })).toEqual({
			replyTo: "r@x.com",
		})
	})

	it("should return empty object for null", () => {
		expect(extractProviderData(null)).toEqual({})
	})

	it("should return empty object for undefined", () => {
		expect(extractProviderData(undefined)).toEqual({})
	})

	it("should return empty object for empty object", () => {
		expect(extractProviderData({})).toEqual({})
	})

	it("should extract cc from provider_data", () => {
		expect(extractProviderData({ cc: "cc@x.com" })).toEqual({ cc: "cc@x.com" })
	})

	it("should extract bcc from provider_data", () => {
		expect(extractProviderData({ bcc: "bcc@x.com" })).toEqual({
			bcc: "bcc@x.com",
		})
	})

	it("should extract replyTo, cc, and bcc together", () => {
		expect(
			extractProviderData({
				replyTo: "r@x.com",
				cc: "cc@x.com",
				bcc: "bcc@x.com",
			}),
		).toEqual({ replyTo: "r@x.com", cc: "cc@x.com", bcc: "bcc@x.com" })
	})

	it("should ignore unknown keys", () => {
		expect(extractProviderData({ unknownKey: "x" })).toEqual({})
	})
})

describe("isBase64String", () => {
	it("should return true for valid base64 strings", () => {
		// "Hello" in base64
		expect(isBase64String("SGVsbG8=")).toBe(true)
		// PNG data URL content (without prefix)
		expect(isBase64String("iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB")).toBe(true)
		// No padding
		expect(isBase64String("SGVsbG8gV29ybGQ")).toBe(true)
	})

	it("should return false for binary digit strings", () => {
		// Binary string (0s and 1s only)
		expect(isBase64String("0100100001101001")).toBe(false)
	})

	it("should return false for regular text", () => {
		expect(isBase64String("Hello World")).toBe(false)
		expect(isBase64String("test@example.com")).toBe(false)
	})

	it("should return false for strings too short", () => {
		expect(isBase64String("abc")).toBe(false)
		expect(isBase64String("")).toBe(false)
	})

	it("should return true for base64 without padding", () => {
		// Some encoders omit padding, which is valid
		expect(isBase64String("SGVSB")).toBe(true)
		expect(isBase64String("SGVsbG8")).toBe(true)
	})
})

describe("buildMailOptions", () => {
	const options = { from: "noreply@store.com" }
	const base: ProviderSendNotificationDTO = {
		to: "customer@example.com",
		channel: "email",
		template: "order-confirmation",
		content: { subject: "Order Confirmed" },
	}

	it("sends html and text as independent parts", () => {
		const mail = buildMailOptions(
			{ ...base, content: { subject: "S", html: "<p>Hi</p>", text: "Hi" } },
			options,
		)
		expect(mail.html).toBe("<p>Hi</p>")
		expect(mail.text).toBe("Hi")
	})

	it("sends a text-only notification as text, not html", () => {
		const mail = buildMailOptions(
			{ ...base, content: { subject: "S", text: "Line 1\nLine 2" } },
			options,
		)
		expect(mail.text).toBe("Line 1\nLine 2")
		expect(mail).not.toHaveProperty("html")
	})

	it("sends an html-only notification without a text part", () => {
		const mail = buildMailOptions(
			{ ...base, content: { subject: "S", html: "<p>Hi</p>" } },
			options,
		)
		expect(mail.html).toBe("<p>Hi</p>")
		expect(mail).not.toHaveProperty("text")
	})

	it("sets no body parts when content has neither", () => {
		const mail = buildMailOptions(base, options)
		expect(mail).not.toHaveProperty("html")
		expect(mail).not.toHaveProperty("text")
		expect(mail.subject).toBe("Order Confirmed")
		expect(mail.to).toBe("customer@example.com")
	})

	it("uses the options from unless the notification carries its own", () => {
		expect(buildMailOptions(base, options).from).toBe("noreply@store.com")
		expect(
			buildMailOptions({ ...base, from: "orders@store.com" }, options).from,
		).toBe("orders@store.com")
	})

	it("passes a display-name from through untouched", () => {
		const mail = buildMailOptions(base, {
			from: "Rack-A-Tiers <tech@rack-a-tiers.com>",
		})
		expect(mail.from).toBe("Rack-A-Tiers <tech@rack-a-tiers.com>")
	})

	it("defaults replyTo from options and lets provider_data override it", () => {
		const withDefault = buildMailOptions(base, {
			...options,
			replyTo: "sales@store.com",
		})
		expect(withDefault.replyTo).toBe("sales@store.com")

		const overridden = buildMailOptions(
			{ ...base, provider_data: { replyTo: "support@store.com" } },
			{ ...options, replyTo: "sales@store.com" },
		)
		expect(overridden.replyTo).toBe("support@store.com")

		expect(buildMailOptions(base, options)).not.toHaveProperty("replyTo")
	})

	it("keeps cc and bcc from provider_data", () => {
		const mail = buildMailOptions(
			{ ...base, provider_data: { cc: "cc@x.com", bcc: "bcc@x.com" } },
			options,
		)
		expect(mail.cc).toBe("cc@x.com")
		expect(mail.bcc).toBe("bcc@x.com")
	})

	it("maps attachments and flags base64 content", () => {
		const mail = buildMailOptions(
			{
				...base,
				attachments: [
					{
						id: "qr",
						filename: "qr.png",
						content: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB",
						content_type: "image/png",
						disposition: "inline",
					},
					{
						id: "doc",
						filename: "doc.txt",
						content: Buffer.from("hello"),
						content_type: "text/plain",
						disposition: "attachment",
					},
				],
			},
			options,
		)
		expect(mail.attachments).toHaveLength(2)
		expect(mail.attachments?.[0]).toMatchObject({
			cid: "qr",
			filename: "qr.png",
			contentType: "image/png",
			contentDisposition: "inline",
			encoding: "base64",
		})
		expect(mail.attachments?.[1]).toMatchObject({
			cid: "doc",
			contentDisposition: "attachment",
			encoding: undefined,
		})
		expect(Buffer.isBuffer(mail.attachments?.[1]?.content)).toBe(true)
	})

	it("omits the attachments key when there are none", () => {
		expect(
			buildMailOptions({ ...base, attachments: [] }, options),
		).not.toHaveProperty("attachments")
	})
})

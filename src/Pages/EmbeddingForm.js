import React, { useState } from "react";
import { Form, Input, Button, notification } from "antd";
import axios from "axios";

const { TextArea } = Input;

function EmbeddingForm() {
  const [loading, setLoading] = useState(false);

  // Called when the user clicks "Submit"
  const onFinish = async (values) => {
    try {
      setLoading(true);

      // Make a POST request to your serverless function with the text & optional metadata
      const res = await axios.post("/.netlify/functions/embed", {
        id: values.docId,
        text: values.docText,
      });

      notification.success({
        message: "Embedding Success",
        description: res.data?.message || "Document embedded successfully!",
      });
    } catch (error) {
      console.error("Error embedding text:", error);
      notification.error({
        message: "Embedding Failed",
        description: error.response?.data?.error || error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "50px auto" }}>
      <h2>Embed Document into Pinecone</h2>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="Document ID"
          name="docId"
          rules={[
            { required: true, message: "Please enter a unique Document ID" },
          ]}
        >
          <Input placeholder="E.g. doc-001" />
        </Form.Item>
        <Form.Item
          label="Document Text"
          name="docText"
          rules={[
            { required: true, message: "Please enter the text to embed" },
          ]}
        >
          <TextArea
            rows={5}
            placeholder="Paste or type your document text here..."
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading}>
            Embed Text
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}

export default EmbeddingForm;

package com.journaldev.spring;

import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;

import org.apache.tika.exception.TikaException;
import org.apache.tika.metadata.Metadata;
import org.apache.tika.parser.ParseContext;
import org.apache.tika.parser.pdf.PDFParser;
import org.apache.tika.sax.BodyContentHandler;
import org.xml.sax.SAXException;

@RestController
public class PersonController {
	
	@RequestMapping("/")
	public String welcome() throws Exception {
		readPdfFile();
		return "Welcome to Apache Tika PDF file Extract...";
	}
	
	public void readPdfFile() throws Exception {
	BodyContentHandler handler = new BodyContentHandler();
      Metadata metadata = new Metadata();
	  ClassLoader classLoader = this.getClass().getClassLoader();
      FileInputStream inputstream = new FileInputStream(new File(classLoader.getResource("Sample.pdf").getFile()));
      ParseContext pcontext = new ParseContext();
      
      //parsing the document using PDF parser
      PDFParser pdfparser = new PDFParser(); 
      pdfparser.parse(inputstream, handler, metadata,pcontext);
      
      //getting the content of the document
      System.out.println("Contents of the PDF :" + handler.toString());
      
      //getting metadata of the document
      System.out.println("Metadata of the PDF:");
      String[] metadataNames = metadata.names();
      
      for(String name : metadataNames) {
         System.out.println(name+ " : " + metadata.get(name));
      }
	}
	
}

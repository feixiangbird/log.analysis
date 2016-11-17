package etl.flow.mgr;

import java.util.ArrayList;
import java.util.List;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import bdap.util.EngineConf;
import bdap.util.JsonUtil;
import bdap.util.PropertiesUtil;
import bdap.util.Util;
import etl.flow.ActionNode;
import etl.flow.CoordConf;
import etl.flow.Flow;
import etl.flow.Node;
import etl.flow.oozie.OozieConf;

public abstract class FlowMgr {
	public static final Logger logger = LogManager.getLogger(FlowMgr.class);
	
	//generate the properties files for all the cmd to initiate
	public List<InMemFile> genProperties(Flow flow){
		List<InMemFile> propertyFiles = new ArrayList<InMemFile>();
		for (Node n: flow.getNodes()){
			if (n instanceof ActionNode){
				ActionNode an = (ActionNode) n;
				String propFileName = String.format("action_%s.properties", an.getName());
				byte[] bytes = PropertiesUtil.getPropertyFileContent(an.getUserProperties());
				propertyFiles.add(new InMemFile(FileType.actionProperty, propFileName, bytes));
			}
		}
		return propertyFiles;
	}
	
	public InMemFile genEnginePropertyFile(EngineConf ec){
		return new InMemFile(FileType.engineProperty, EngineConf.file_name, ec.getContent());
	}
	
	public abstract boolean deployFlowFromJson(String projectName, Flow flow, FlowServerConf fsconf, EngineConf ec);
	public abstract String executeFlow(String projectDir, String flowName, OozieConf oc, EngineConf ec);
	public abstract String executeCoordinator(String projectDir, String flowName, OozieConf oc, EngineConf ec, CoordConf cc);
	
	/**
	 * update helper jars, mapping.properties
	 * @param files
	 * @param fsconf
	 * @param ec
	 * @return
	 */
	public abstract void uploadFiles(String projectName, String flowName, InMemFile[] files, FlowServerConf fsconf, EngineConf ec);
	
	/**
	 * get the flow log of submitted instance
	 * @param projectName
	 * @param fsconf
	 * @param instanceId
	 * @param nodeName
	 * @return log content
	 */
	public abstract String getFlowLog(String projectName, FlowServerConf fsconf, String instanceId);
	
	/**
	 * get the action node log of submitted instance
	 * @param projectName
	 * @param fsconf
	 * @param instanceId
	 * @param nodeName
	 * @return log content
	 */
	public abstract String getNodeLog(String projectName, FlowServerConf fsconf, String instanceId, String nodeName);
	
	/**
	 * get the action node info of submitted instance
	 * @param projectName
	 * @param fsconf
	 * @param instanceId
	 * @param nodeName
	 * @return node info
	 */
	public abstract NodeInfo getNodeInfo(String projectName, FlowServerConf fsconf, String instanceId, String nodeName);
	
	/**
	 * list the action node's input files
	 * @param projectName
	 * @param fsconf
	 * @param instanceId
	 * @param nodeName
	 * @return list of file paths
	 */
	public abstract String[] listNodeInputFiles(String projectName, FlowServerConf fsconf, String instanceId, String nodeName);
	
	/**
	 * list the action node's output files
	 * @param projectName
	 * @param fsconf
	 * @param instanceId
	 * @param nodeName
	 * @return list of file paths
	 */
	public abstract String[] listNodeOutputFiles(String projectName, FlowServerConf fsconf, String instanceId, String nodeName);
	
	/**
	 * get the distributed file
	 * @param fsconf
	 * @param filePath
	 * @return file content
	 */
	public abstract InMemFile getDFSFile(FlowServerConf fsconf, String filePath);
	
	//generate json file from java construction
	public static void genFlowJson(String rootFolder, String projectName, Flow flow){
		String jsonFileName=String.format("%s/%s/%s/%s.json", rootFolder, projectName, flow.getName(), flow.getName());
		String jsonString = JsonUtil.toJsonString(flow);
		Util.writeFile(jsonFileName, jsonString);
	}
}
